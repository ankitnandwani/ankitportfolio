import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  PERFORMANCE_BUDGETS,
  evaluateBudgets,
  formatBytes,
  formatSeconds,
  type BudgetLimit,
} from './budgets.ts';

/**
 * The script of the measurement, so that it can be run from a test.
 */
const SCRIPT = fileURLToPath(new URL('../../../scripts/measurePerformance.mts', import.meta.url));

/**
 * A budget of one rule, so that a test can write the rule it needs.
 *
 * @param limit The rule to write.
 * @returns A budget that holds the rule and nothing else.
 */
function budgetOf(limit: BudgetLimit): Record<string, BudgetLimit> {
  return { [limit.name]: limit };
}

test('a measure over its ceiling is a failure and the failure names the rule, the value and the ceiling', () => {
  const budget = budgetOf({
    name: 'first-load-js:home',
    kind: 'atMost',
    limit: 1_000,
    unit: 'bytes',
    note: 'the ceiling of a test',
  });

  const evaluation = evaluateBudgets({ 'first-load-js:home': 1_500 }, budget);

  assert.equal(evaluation.failures.length, 1);
  assert.equal(evaluation.failures[0].name, 'first-load-js:home');
  assert.equal(evaluation.failures[0].measured, 1_500);
  assert.equal(evaluation.failures[0].limit, 1_000);
  assert.equal(evaluation.failures[0].unit, 'bytes');
});

test('a measure under its ceiling is not a failure', () => {
  const budget = budgetOf({
    name: 'first-load-js:home',
    kind: 'atMost',
    limit: 1_000,
    unit: 'bytes',
    note: 'the ceiling of a test',
  });

  const evaluation = evaluateBudgets({ 'first-load-js:home': 999 }, budget);

  assert.equal(evaluation.failures.length, 0);
  assert.equal(evaluation.withoutBudget.length, 0);
});

test('a measure that is exactly on its ceiling is not a failure', () => {
  const budget = budgetOf({
    name: 'first-load-js:home',
    kind: 'atMost',
    limit: 1_000,
    unit: 'bytes',
    note: 'the ceiling of a test',
  });

  const evaluation = evaluateBudgets({ 'first-load-js:home': 1_000 }, budget);

  assert.equal(evaluation.failures.length, 0);
});

test('a measure that is not in the budget is reported and is not a failure', () => {
  const budget = budgetOf({
    name: 'first-load-js:home',
    kind: 'atMost',
    limit: 1_000,
    unit: 'bytes',
    note: 'the ceiling of a test',
  });

  const evaluation = evaluateBudgets(
    { 'first-load-js:home': 10, 'first-load-js:new-page': 20 },
    budget
  );

  assert.equal(evaluation.failures.length, 0);
  assert.deepEqual(evaluation.withoutBudget, ['first-load-js:new-page']);
});

test('a rule of the kind atLeast fails when the value is under its floor', () => {
  const budget = budgetOf({
    name: 'cache-max-age:public/favicon.ico',
    kind: 'atLeast',
    limit: 3_600,
    unit: 'seconds',
    note: 'the floor of a test',
  });

  const failed = evaluateBudgets({ 'cache-max-age:public/favicon.ico': 0 }, budget);
  const held = evaluateBudgets({ 'cache-max-age:public/favicon.ico': 3_600 }, budget);

  assert.equal(failed.failures.length, 1);
  assert.equal(failed.failures[0].kind, 'atLeast');
  assert.equal(held.failures.length, 0);
});

test('a rule of the budget that was not measured is not a failure and is not reported', () => {
  const budget = budgetOf({
    name: 'first-load-js:home',
    kind: 'atMost',
    limit: 1_000,
    unit: 'bytes',
    note: 'the ceiling of a test',
  });

  const evaluation = evaluateBudgets({ 'first-load-js:other': 10 }, budget);

  assert.equal(evaluation.failures.length, 0);
  assert.deepEqual(evaluation.withoutBudget, ['first-load-js:other']);
});

test('the budget holds a rule for every page of the site', () => {
  const pages = ['home', 'contact', 'design-system', 'job-fit', 'projects', 'resume'];
  const measures = [
    'first-load-js',
    'css',
    'preloaded-fonts',
    'html-size',
    'html-gzip',
    'images',
    'cache-max-age',
  ];

  for (const page of pages) {
    for (const measure of measures) {
      assert.ok(
        PERFORMANCE_BUDGETS[`${measure}:${page}`],
        `the budget has no rule for ${measure}:${page}`
      );
    }
  }
});

test('the budget holds a rule for the whole build and for the routes of the API', () => {
  const names = [
    'build-client-js',
    'build-largest-chunk',
    'build-css',
    'build-font-files',
    'build-font-bytes',
    'cache-max-age:api/chat',
    'cache-max-age:api/contact',
    'cache-max-age:api/job-fit',
    'cache-max-age:api/feedback',
    'cache-max-age:api/analytics',
    'cache-max-age:file/favicon.ico',
  ];

  for (const name of names) {
    assert.ok(PERFORMANCE_BUDGETS[name], `the budget has no rule for ${name}`);
  }
});

test('every rule of the budget says where its number came from', () => {
  for (const [name, rule] of Object.entries(PERFORMANCE_BUDGETS)) {
    assert.equal(rule.name, name);
    assert.ok(rule.note.length > 10, `the rule ${name} has no note`);
    assert.ok(rule.limit >= 0, `the rule ${name} has a negative limit`);
    assert.ok(['atMost', 'atLeast'].includes(rule.kind), `the rule ${name} has no direction`);
  }
});

test('the answers of the API are never to be kept', () => {
  for (const route of ['chat', 'contact', 'job-fit', 'feedback', 'analytics']) {
    const rule = PERFORMANCE_BUDGETS[`cache-max-age:api/${route}`];

    assert.ok(rule);
    assert.equal(rule.kind, 'atMost');
    assert.equal(rule.limit, 0);
  }
});

test('a number of bytes is written in a way a person reads it', () => {
  assert.equal(formatBytes(512), '512 bytes');
  assert.equal(formatBytes(38_760), '37.9 kB (38760 bytes)');
  assert.equal(formatBytes(1_965_463), '1.87 MB (1965463 bytes)');
});

test('a number of seconds is written in a way a person reads it', () => {
  assert.equal(formatSeconds(0), '0 seconds');
  assert.equal(formatSeconds(45), '45 seconds');
  assert.equal(formatSeconds(3_600), '1.0 hours (3600 seconds)');
  assert.equal(formatSeconds(31_536_000), '365.0 days (31536000 seconds)');
});

test('the script exits with a non-zero code when the build is missing', () => {
  const empty = mkdtempSync(path.join(tmpdir(), 'perf-budget-'));

  try {
    const result = spawnSync(process.execPath, [SCRIPT], {
      env: { ...process.env, PERF_BUILD_DIR: path.join(empty, 'no-build') },
      encoding: 'utf8',
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /no build/i);
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }
});
