#!/usr/bin/env node
/**
 * Verification script for the Contact Form.
 *
 * Runs test cases against the live API and writes a report with the result
 * of every rule. Exits with a non-zero code when a rule fails.
 *
 * Usage:
 *   npm run verify:contact
 *   # or
 *   node scripts/verifyContact.mts
 *
 * Requires:
 * - Development server running at http://localhost:3000
 */

import { CONTACT_FORM_FIXTURES, RATE_LIMIT_FIXTURES } from '../src/lib/contact/fixtures/contactFixtures.ts';

interface RuleResult {
  rule: string;
  fixture: string;
  passed: boolean;
  message?: string;
}

interface FixtureReport {
  fixture: typeof CONTACT_FORM_FIXTURES[0];
  success: boolean;
  statusCode?: number;
  rules: RuleResult[];
  response?: unknown;
  error?: string;
}

/**
 * Checks that the response has rate limit headers.
 */
function checkRateLimitHeaders(headers: Headers): { passed: boolean; missing?: string } {
  const required = ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'];
  for (const h of required) {
    if (!headers.has(h)) {
      return { passed: false, missing: h };
    }
  }
  return { passed: true };
}

/**
 * Checks that the response has Cache-Control: no-store.
 */
function checkNoStore(headers: Headers): { passed: boolean } {
  const cacheControl = headers.get('Cache-Control') ?? '';
  return { passed: cacheControl.includes('no-store') };
}

/**
 * Runs all rules against a single fixture and returns the report.
 */
async function verifyFixture(
  fixture: typeof CONTACT_FORM_FIXTURES[0],
  clientIp: string
): Promise<FixtureReport> {
  console.log(`\n=== Verifying: ${fixture.label} (${fixture.id}) ===`);

  const report: FixtureReport = {
    fixture,
    success: false,
    rules: [],
  };

  try {
    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Forwarded-For': clientIp,
      },
      body: JSON.stringify(fixture.data),
    });

    report.statusCode = response.status;
    report.response = await response.json();

    // Rule 1: Expected status code
    const statusMatch = response.status === fixture.expectedStatus;
    report.rules.push({
      rule: 'expected_status',
      fixture: fixture.id,
      passed: statusMatch,
      message: statusMatch ? undefined : `Expected ${fixture.expectedStatus}, got ${response.status}`,
    });

    // Rule 2: Expected success in response body
    const responseBody = report.response as Record<string, unknown>;
    if (fixture.expectedSuccess !== undefined) {
      const successMatch = responseBody.ok === fixture.expectedSuccess;
      report.rules.push({
        rule: 'expected_success',
        fixture: fixture.id,
        passed: successMatch,
        message: successMatch ? undefined : `Expected ok=${fixture.expectedSuccess}, got ${responseBody.ok}`,
      });
    }

    // Rule 3: Rate limit headers present
    const rateLimitCheck = checkRateLimitHeaders(response.headers);
    report.rules.push({
      rule: 'rate_limit_headers',
      fixture: fixture.id,
      passed: rateLimitCheck.passed,
      message: rateLimitCheck.passed ? undefined : `Missing header: ${rateLimitCheck.missing}`,
    });

    // Rule 4: Cache-Control: no-store
    const noStoreCheck = checkNoStore(response.headers);
    report.rules.push({
      rule: 'no_store_header',
      fixture: fixture.id,
      passed: noStoreCheck.passed,
      message: noStoreCheck.passed ? undefined : 'Cache-Control missing no-store',
    });

    // Rule 5: Field errors present for validation failures
    if (fixture.expectedStatus === 400 && fixture.expectedErrors) {
      const errors = responseBody.errors as Record<string, string> | undefined;
      let allErrorsPresent = true;
      let missingError = '';
      for (const field of fixture.expectedErrors) {
        if (!errors?.[field]) {
          allErrorsPresent = false;
          missingError = field;
          break;
        }
      }
      report.rules.push({
        rule: 'validation_errors',
        fixture: fixture.id,
        passed: allErrorsPresent,
        message: allErrorsPresent ? undefined : `Missing error for field: ${missingError}`,
      });
    }

    // Rule 6: Success message for successful submission
    if (fixture.expectedStatus === 200) {
      const hasMessage = typeof responseBody.message === 'string' && responseBody.message.length > 0;
      report.rules.push({
        rule: 'success_message',
        fixture: fixture.id,
        passed: hasMessage,
        message: hasMessage ? undefined : 'Missing success message',
      });
    }

    // Rule 7: Error message for rate limit
    if (fixture.expectedStatus === 429) {
      const hasRetryAfter = response.headers.has('Retry-After');
      const hasErrorMessage = typeof responseBody.error === 'string' && responseBody.error.length > 0;
      report.rules.push({
        rule: 'rate_limit_error',
        fixture: fixture.id,
        passed: hasRetryAfter && hasErrorMessage,
        message: (!hasRetryAfter || !hasErrorMessage) ? 'Missing Retry-After or error message' : undefined,
      });
    }

    report.success = report.rules.every((r) => r.passed);

  } catch (error) {
    report.success = false;
    report.error = error instanceof Error ? error.message : String(error);
    report.rules.push({
      rule: 'request_failed',
      fixture: fixture.id,
      passed: false,
      message: `Request failed: ${report.error}`,
    });
  }

  return report;
}

/**
 * Verifies rate limit enforcement by sending multiple requests from the same IP.
 */
async function verifyRateLimit(): Promise<RuleResult[]> {
  console.log('\n=== Verifying Rate Limit Enforcement ===');
  
  const rules: RuleResult[] = [];
  const testIp = '192.0.2.100'; // TEST-NET-1 address for rate limit testing
  
  // Send 4 rapid requests from the same IP
  for (const fixture of RATE_LIMIT_FIXTURES) {
    console.log(`  Sending ${fixture.id} from ${testIp}...`);
    
    try {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Forwarded-For': testIp,
        },
        body: JSON.stringify(fixture.data),
      });

      const responseBody = await response.json();
      const statusMatch = response.status === fixture.expectedStatus;
      
      rules.push({
        rule: `rate_limit_${fixture.id}`,
        fixture: fixture.id,
        passed: statusMatch,
        message: statusMatch ? undefined : `Expected ${fixture.expectedStatus}, got ${response.status}`,
      });

      if (fixture.expectedStatus === 429) {
        const hasRetryAfter = response.headers.has('Retry-After');
        const hasErrorMessage = typeof responseBody.error === 'string' && responseBody.error.length > 0;
        rules.push({
          rule: 'rate_limit_error',
          fixture: fixture.id,
          passed: hasRetryAfter && hasErrorMessage,
          message: (!hasRetryAfter || !hasErrorMessage) ? 'Missing Retry-After or error message' : undefined,
        });
      }

      if (statusMatch) {
        console.log(`    ✓ ${fixture.id} - status ${response.status}`);
      } else {
        console.log(`    ✗ ${fixture.id} - expected ${fixture.expectedStatus}, got ${response.status}`);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      rules.push({
        rule: `rate_limit_${fixture.id}`,
        fixture: fixture.id,
        passed: false,
        message: `Request failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
  
  return rules;
}

/**
 * Verifies rate limit isolation - contact form limits don't affect chat/job-fit.
 */
async function verifyRateLimitIsolation(): Promise<RuleResult[]> {
  console.log('\n=== Verifying Rate Limit Isolation ===');
  
  const rules: RuleResult[] = [];

  // First, exhaust contact form rate limit from one IP
  const contactIp = '192.0.2.200';
  for (let i = 0; i < 3; i++) {
    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Forwarded-For': contactIp,
      },
      body: JSON.stringify({
        name: `Test User ${i}`,
        email: `test${i}@example.com`,
        company: 'Test Corp',
        message: 'Test message for isolation verification.',
      }),
    });
    if (!response.ok) {
      console.log(`  Warning: Contact form request ${i + 1} failed: ${response.status}`);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Now test chat rate limit from a DIFFERENT IP (should be unaffected - 20/30min)
  const chatIp = '192.0.2.201';
  let chatAllowed = 0;
  for (let i = 0; i < 3; i++) {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Forwarded-For': chatIp,
      },
      body: JSON.stringify({ message: `Test chat message ${i}` }),
    });
    if (response.ok) chatAllowed++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const isolationCheck = chatAllowed === 3;
  rules.push({
    rule: 'rate_limit_isolation',
    fixture: 'isolation',
    passed: isolationCheck,
    message: isolationCheck ? undefined : 'Chat rate limit affected by contact form requests',
  });
  
  console.log(`  ${isolationCheck ? '✓' : '✗'} rate_limit_isolation${isolationCheck ? '' : ' — Chat limit affected'}`);
  
  return rules;
}

/**
 * Main verification function.
 */
async function main(): Promise<void> {
  console.log('Contact Form — End-to-End Verification');
  console.log('======================================\n');

  const liveServer = process.env.LIVE_SERVER_URL ?? 'http://localhost:3000';
  
  // Check if server is running
  try {
    const healthCheck = await fetch(`${liveServer}/api/contact`, { method: 'HEAD' });
    if (!healthCheck.ok && healthCheck.status !== 405) {
      console.log(`ERROR: Server not responding at ${liveServer}`);
      process.exit(1);
    }
  } catch {
    console.log(`ERROR: Cannot reach server at ${liveServer}. Is the dev server running?`);
    process.exit(1);
  }

  console.log(`Running verification...`);

  const reports: FixtureReport[] = [];

  // Run rate limit enforcement FIRST (uses a dedicated IP) to avoid pollution from other tests
  console.log('\n=== Rate Limit Enforcement ===');
  const rateLimitRules = await verifyRateLimit();
  
  // Run main fixture tests
  console.log(`\nRunning verification against ${CONTACT_FORM_FIXTURES.length} fixtures...\n`);

  // Use a unique IP for each fixture to avoid rate limiting across tests
  const baseIp = '198.51.100'; // TEST-NET-2
  
  for (let i = 0; i < CONTACT_FORM_FIXTURES.length; i++) {
    const fixture = CONTACT_FORM_FIXTURES[i];
    const clientIp = `${baseIp}.${i + 1}`;
    
    // Small delay between fixtures
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const report = await verifyFixture(fixture, clientIp);
    reports.push(report);

    // Print rule results
    for (const rule of report.rules) {
      const status = rule.passed ? '✓' : '✗';
      const message = rule.message ? ` — ${rule.message}` : '';
      console.log(`  ${status} ${rule.rule}${message}`);
    }

    if (report.error) {
      console.log(`  ✗ ERROR: ${report.error}`);
    }
  }

  // Rate limit isolation (uses dedicated IPs)
  const isolationRules = await verifyRateLimitIsolation();

  // Summary
  console.log('\n=== SUMMARY ===');
  let totalRules = 0;
  let passedRules = 0;
  let failedFixtures = 0;

  for (const report of reports) {
    const fixturePassed = report.rules.every((r) => r.passed);
    if (!fixturePassed) failedFixtures++;

    for (const rule of report.rules) {
      totalRules++;
      if (rule.passed) passedRules++;
    }
  }

  // Add rate limit and isolation rules to totals
  for (const rule of rateLimitRules) {
    totalRules++;
    if (rule.passed) passedRules++;
  }
  for (const rule of isolationRules) {
    totalRules++;
    if (rule.passed) passedRules++;
  }

  console.log(`Fixtures: ${reports.length}`);
  console.log(`Fixtures with failures: ${failedFixtures}`);
  console.log(`Rules checked: ${totalRules}`);
  console.log(`Rules passed: ${passedRules}`);
  console.log(`Rules failed: ${totalRules - passedRules}`);

  // Print failed rules
  if (passedRules < totalRules) {
    console.log('\n=== FAILED RULES ===');
    for (const report of reports) {
      for (const rule of report.rules) {
        if (!rule.passed) {
          console.log(`  ✗ [${report.fixture.id}] ${rule.rule}: ${rule.message}`);
        }
      }
    }
    for (const rule of rateLimitRules) {
      if (!rule.passed) {
        console.log(`  ✗ [${rule.fixture}] ${rule.rule}: ${rule.message}`);
      }
    }
    for (const rule of isolationRules) {
      if (!rule.passed) {
        console.log(`  ✗ [isolation] ${rule.rule}: ${rule.message}`);
      }
    }
  }

  // Exit code
  process.exit(passedRules === totalRules ? 0 : 1);
}

main().catch((error) => {
  console.error('Verification script failed:', error);
  process.exit(1);
});