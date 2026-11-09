#!/usr/bin/env node
/**
 * Sets up the project of Sentry and writes the address of the service into
 * the file of the environment of the machine.
 *
 * The script never prints the token and never prints the address of the
 * service. The address goes into `.env.local`, which is not in the
 * repository, and it is not written anywhere else.
 *
 * What the script does:
 *
 * 1. It looks for the project of the organization. If it is not there yet, it
 *    creates it, with the platform of Next.js and with the rule that alerts
 *    on a new issue turned on.
 * 2. It reads the address of the service of the project and writes it into
 *    `.env.local`, for the server and for the browser.
 * 3. It prints what is left to do by hand: the rules of the alerts and the
 *    variables of the deployment.
 *
 * What it needs, in `.env.local` or in the environment:
 *
 * - `SENTRY_ORG` – the slug of the organization.
 * - `SENTRY_PROJECT` – the slug of the project.
 * - `SENTRY_AUTH_TOKEN` – a token with the rights `project:read` and
 *   `project:write`. It is made in the page of the account of Sentry, under
 *   the API tokens.
 *
 * Usage:
 *   npm run setup:sentry
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * The address of the API of the service.
 *
 * It can be changed for a service of one's own.
 */
const API_URL = process.env.SENTRY_API_URL ?? 'https://sentry.io/api/0';

/**
 * The platform of the project.
 *
 * The service of Sentry decides what the page of the project shows and which
 * integrations are offered, and the platform of Next.js is the one of this
 * site.
 */
const PLATFORM = 'javascript-nextjs';

/**
 * The environments of the project.
 *
 * The site names them itself: `production` when it runs for the visitors and
 * `development` when it runs on a machine of a person. Sentry makes an
 * environment the first time a failure arrives with that name.
 */
const ENVIRONMENTS = ['production', 'development'];

/**
 * A project of the service.
 */
interface SentryProject {
  id: string;
  slug: string;
  name: string;
  platform?: string | null;
}

/**
 * A key of a project.
 */
interface SentryKey {
  id: string;
  name: string;
  dsn: { public: string };
}

/**
 * Calls the API of the service.
 *
 * @param path The path of the call, after the address of the API.
 * @param options The method and the body.
 * @returns The answer of the service.
 */
async function callApi<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = process.env.SENTRY_AUTH_TOKEN;

  if (!token) {
    throw new Error('SENTRY_AUTH_TOKEN is not set.');
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();

  if (!response.ok) {
    // The answer of the service can hold the reason of the failure, and it
    // never holds the token.
    throw new Error(`The service answered with ${response.status}: ${text.slice(0, 300)}`);
  }

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

/**
 * Looks for the project of the organization.
 */
async function findProject(org: string, project: string): Promise<SentryProject | undefined> {
  const projects = await callApi<SentryProject[]>(`/organizations/${org}/projects/`);

  return projects.find((entry) => entry.slug === project);
}

/**
 * Creates the project of the organization.
 */
async function createProject(org: string, project: string): Promise<SentryProject> {
  return callApi<SentryProject>(`/organizations/${org}/projects/`, {
    method: 'POST',
    body: {
      name: project,
      slug: project,
      platform: PLATFORM,
      // The rule that alerts on a new issue is on, so a new failure reaches
      // the owner by mail.
      default_rules: true,
    },
  });
}

/**
 * Reads the address of the service of the project.
 */
async function readDsn(org: string, project: string): Promise<string> {
  const keys = await callApi<SentryKey[]>(`/projects/${org}/${project}/keys/`);

  if (keys.length === 0) {
    throw new Error('The project has no key. A key has to be made in the page of the project.');
  }

  const dsn = keys[0].dsn?.public;

  if (!dsn) {
    throw new Error('The key of the project has no address.');
  }

  return dsn;
}

/**
 * Writes a value into the file of the environment of the machine.
 *
 * A value that is already there is replaced, and a value that is not there is
 * added at the end.
 *
 * @param name The name of the variable.
 * @param value The value of the variable.
 */
function writeEnvironmentValue(name: string, value: string): void {
  const file = '.env.local';
  const lines = existsSync(file) ? readFileSync(file, 'utf8').split('\n') : [];
  const pattern = new RegExp(`^${name}=`);
  let found = false;

  const updated = lines.map((line) => {
    if (!pattern.test(line)) {
      return line;
    }

    found = true;

    return `${name}=${value}`;
  });

  if (!found) {
    updated.push(`${name}=${value}`);
  }

  writeFileSync(file, `${updated.join('\n').replace(/\n+$/, '')}\n`);
}

/**
 * The main function of the setup.
 */
async function main(): Promise<void> {
  console.log('Sentry — Setup of the project');
  console.log('============================\n');

  const org = process.env.SENTRY_ORG?.trim();
  const project = process.env.SENTRY_PROJECT?.trim();

  if (!org || !project) {
    console.log('ERROR: SENTRY_ORG and SENTRY_PROJECT have to be set.');
    console.log('Put them in .env.local, next to SENTRY_AUTH_TOKEN, and run the script again.');
    process.exit(1);
  }

  if (!process.env.SENTRY_AUTH_TOKEN) {
    console.log('ERROR: SENTRY_AUTH_TOKEN is not set.');
    console.log('A token with the rights project:read and project:write is made in the page');
    console.log('of the account of Sentry, under the API tokens.');
    process.exit(1);
  }

  const existing = await findProject(org, project);

  if (existing) {
    console.log(`✓ The project ${project} is already there.`);
  } else {
    const created = await createProject(org, project);
    console.log(`✓ The project ${created.slug} was created.`);
  }

  const dsn = await readDsn(org, project);

  writeEnvironmentValue('SENTRY_DSN', dsn);
  writeEnvironmentValue('NEXT_PUBLIC_SENTRY_DSN', dsn);

  console.log('✓ The address of the service was written into .env.local.');
  console.log('  It was not printed, and it is not in the repository.\n');

  console.log('The environments of the project:');
  for (const environment of ENVIRONMENTS) {
    console.log(`  · ${environment} — it appears the first time a failure arrives with that name.`);
  }

  console.log('\nWhat is left to do by hand, in the page of the project:');
  console.log('  1. The rule for a new issue is on by default, and it sends a mail.');
  console.log('     Check that the address of the mail is the one of the owner.');
  console.log('  2. Add a second rule: an issue happens more than ten times in ten');
  console.log('     minutes. A failure that repeats is the one that matters, and a');
  console.log('     mail for every occurrence of the same issue is noise.');
  console.log('  3. The variables of the deployment: SENTRY_DSN,');
  console.log('     NEXT_PUBLIC_SENTRY_DSN, SENTRY_RELEASE and');
  console.log('     NEXT_PUBLIC_SENTRY_RELEASE.');
  console.log('  4. Run the verification: npm run verify:monitoring');
  console.log('     It sends one report marked with verification: true.');
}

main().catch((error) => {
  console.error('The setup failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
