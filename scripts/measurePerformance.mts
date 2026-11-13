#!/usr/bin/env node
/**
 * The measurement of the size of the site.
 *
 * It reads the output of a production build, asks the running site for the
 * HTML of every page and for the headers of the files of `public/`, and
 * compares what it found with the ceilings of `src/lib/performance/budgets.ts`.
 * It exits with a non-zero code when a measure is over its ceiling.
 *
 * What is measured:
 *
 * - The JavaScript, the CSS, the fonts and the HTML of every page, taken from
 *   the answer of the running site, so that the chunks that are loaded later
 *   are not counted as part of the first load.
 * - The JavaScript, the CSS and the fonts of the whole build.
 * - The cache of the pages, of the files of `public/` and of the routes of the
 *   API.
 *
 * The measurement reads the build and the running site. It never asks a
 * visitor anything and it prints no body, no cookie and no address of a
 * visitor.
 *
 * Usage:
 *   npm run perf:budget
 *   # or
 *   node scripts/measurePerformance.mts
 *
 * Requires:
 * - A production build. `npm run build` before this script.
 *
 * Optional:
 * - `PERF_BASE_URL` – the address of a site that is already running. The
 *   script starts its own server when this is not given.
 * - `PERF_PORT` – the port of the server the script starts. The default is
 *   3111, so that a development server on 3000 is not disturbed.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import {
  PERFORMANCE_BUDGETS,
  evaluateBudgets,
  formatBytes,
  formatSeconds,
} from '../src/lib/performance/budgets.ts';

/**
 * The root of the repository, so that the build and the files of `public/`
 * are found whatever the folder the script is run from.
 */
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The folder of the build.
 *
 * The environment can point it somewhere else, so that the script can be
 * checked against a build that is not there.
 */
const BUILD_DIR = process.env.PERF_BUILD_DIR
  ? path.resolve(process.env.PERF_BUILD_DIR)
  : path.join(REPO_ROOT, '.next');

/** The folder of the static files of the build. */
const STATIC_DIR = path.join(BUILD_DIR, 'static');

/** The folder of the files the site serves by hand. */
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');

/** The port the server of the script listens on when the script starts it. */
const DEFAULT_PORT = 3111;

/** How long the script waits for the server to answer, in milliseconds. */
const SERVER_TIMEOUT_MS = 40_000;

/** The routes of the API, whose answers are never to be kept. */
const API_ROUTES = ['/api/chat', '/api/contact', '/api/job-fit', '/api/feedback', '/api/analytics'];

/** The other files of the site that a visitor asks for on every visit. */
const SITE_FILES = ['/favicon.ico'];

/** One file that the site sends. */
interface Asset {
  /** The path of the file, relative to the repository. */
  file: string;
  /** The size of the file in bytes. */
  bytes: number;
}

/** What the site sends with one page. */
interface PageMeasurement {
  /** The route of the page. */
  route: string;
  /** The status of the answer. */
  status: number;
  /** The size of the HTML, not compressed. */
  htmlBytes: number;
  /** The size of the HTML, compressed. */
  htmlGzipBytes: number;
  /** The JavaScript of the first load. */
  js: Asset[];
  /** The CSS of the page. */
  css: Asset[];
  /** The fonts the page preloads. */
  fonts: Asset[];
  /** The pictures of the page. */
  images: { source: string; bytes: number | null }[];
  /** The header of the cache of the answer. */
  cacheControl: string;
}

/**
 * The result of the measurement of the whole site.
 */
interface Measurement {
  /** Every measure, by name. */
  measures: Record<string, number>;
  /** The JavaScript of the whole build, with the name of the biggest chunk. */
  buildJs: { files: Asset[]; total: number; largest: Asset | null };
  /** The CSS of the whole build. */
  buildCss: { files: Asset[]; total: number };
  /** The fonts of the whole build. */
  buildFonts: { files: Asset[]; total: number };
  /** Every page that was measured. */
  pages: PageMeasurement[];
  /** The routes that could not be measured, with the reason. */
  skipped: { route: string; reason: string }[];
  /** The cache of the files of `public/`. */
  publicCache: { file: string; cacheControl: string; maxAge: number }[];
  /** The cache of the other files of the site. */
  siteFiles: { file: string; cacheControl: string; maxAge: number }[];
  /** The cache of the routes of the API. */
  apiCache: { route: string; status: number; cacheControl: string; maxAge: number }[];
}

/**
 * Lists the files of a folder, and of the folders inside it.
 *
 * @param directory The folder to walk.
 * @returns The path of every file that was found.
 */
function listFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  const found: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      found.push(...listFiles(full));
    } else if (entry.isFile()) {
      found.push(full);
    }
  }

  return found;
}

/**
 * Reads the size of a file.
 *
 * @param file The path of the file.
 * @returns The size in bytes, or null when the file is not there.
 */
function sizeOfFile(file: string): number | null {
  try {
    return statSync(file).size;
  } catch {
    return null;
  }
}

/**
 * Turns an address of the site into the path of the file that holds it.
 *
 * @param url The address, such as `/_next/static/chunks/app.js`.
 * @returns The path of the file in the repository, or null when the address
 *   does not name a file of the build.
 */
function resolveStaticUrl(url: string): string | null {
  if (url.startsWith('/_next/')) {
    return path.join(BUILD_DIR, url.slice('/_next/'.length));
  }

  if (url.startsWith('/')) {
    return path.join(PUBLIC_DIR, url.slice(1));
  }

  return null;
}

/**
 * Reads the attribute of a tag of the HTML.
 *
 * @param tag The whole tag.
 * @param name The name of the attribute.
 * @returns The value of the attribute, or null when the tag does not have it.
 */
function readAttribute(tag: string, name: string): string | null {
  const match = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag);
  return match ? match[1] : null;
}

/**
 * Reads the tags of the HTML of a page.
 *
 * @param html The HTML of the page.
 * @param name The name of the tag, such as `script`.
 * @returns Every tag of that name.
 */
function readTags(html: string, name: string): string[] {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? [];
}

/**
 * Reads the number of seconds of the cache of a header.
 *
 * The number of the platform comes first when it is there, because that is
 * the one that says how long the edge keeps a page. The number of the browser
 * is used otherwise.
 *
 * @param cacheControl The header of the cache.
 * @returns The number of seconds, or 0 when the header says nothing.
 */
function readMaxAge(cacheControl: string): number {
  const shared = /(?:^|,)\s*s-maxage\s*=\s*(\d+)/i.exec(cacheControl);
  if (shared) {
    return Number(shared[1]);
  }

  const browser = /(?:^|,)\s*max-age\s*=\s*(\d+)/i.exec(cacheControl);
  return browser ? Number(browser[1]) : 0;
}

/**
 * Reads the names of the pages of the site out of the build.
 *
 * The pages that are made on every request, such as `/projects/[slug]`, are
 * told apart from the ones that are made at the time of the build, because
 * the second ones have a page that can be asked for and the first ones do
 * not.
 *
 * @returns The pages that can be measured and the ones that cannot.
 */
function discoverPages(): { pages: string[]; dynamic: string[] } {
  const manifestPath = path.join(BUILD_DIR, 'app-path-routes-manifest.json');

  if (!existsSync(manifestPath)) {
    return { pages: [], dynamic: [] };
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, string>;
  const pages: string[] = [];
  const dynamic: string[] = [];

  for (const key of Object.keys(manifest)) {
    if (!key.endsWith('/page')) {
      continue;
    }

    const route = key.slice(0, -'/page'.length) || '/';

    if (route.includes('_not-found') || route.includes('_global-error')) {
      continue;
    }

    if (route.includes('[')) {
      dynamic.push(route);
    } else {
      pages.push(route);
    }
  }

  return { pages: pages.sort(), dynamic: dynamic.sort() };
}

/**
 * Starts the server of the production build and waits until it answers.
 *
 * @param port The port the server listens on.
 * @returns The address of the server and the function that stops it, or null
 *   when the server could not be started.
 */
async function startServer(port: number): Promise<{ baseUrl: string; stop: () => void } | null> {
  const binary = path.join(REPO_ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');

  if (!existsSync(binary)) {
    console.error('The binary of Next.js is not in node_modules. Run `npm ci` first.');
    return null;
  }

  const child: ChildProcess = spawn(process.execPath, [binary, 'start', '-p', String(port)], {
    cwd: REPO_ROOT,
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore',
  });

  let stopped = false;
  const stop = () => {
    if (stopped) {
      return;
    }

    stopped = true;
    child.kill('SIGTERM');
  };

  process.on('exit', stop);

  const baseUrl = `http://localhost:${port}`;
  const deadline = Date.now() + SERVER_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      console.error(`The server stopped with the code ${child.exitCode}.`);
      stop();
      return null;
    }

    try {
      const answer = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(2000) });
      if (answer.status < 500) {
        return { baseUrl, stop };
      }
    } catch {
      // The server is not ready yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  console.error(`The server did not answer in ${SERVER_TIMEOUT_MS / 1000} seconds.`);
  stop();
  return null;
}

/**
 * Asks the server for a page and reads what it sends.
 *
 * @param baseUrl The address of the server.
 * @param route The route of the page.
 * @returns What the page sends, or null when the page could not be asked for.
 */
async function measurePage(baseUrl: string, route: string): Promise<PageMeasurement | null> {
  let answer: Response;

  try {
    answer = await fetch(`${baseUrl}${route}`, { signal: AbortSignal.timeout(15_000) });
  } catch {
    return null;
  }

  const html = await answer.text();
  const js: Asset[] = [];
  const css: Asset[] = [];
  const fonts: Asset[] = [];
  const images: { source: string; bytes: number | null }[] = [];

  const seenJs = new Set<string>();
  for (const tag of readTags(html, 'script')) {
    const src = readAttribute(tag, 'src');
    if (!src || !src.endsWith('.js') || seenJs.has(src)) {
      continue;
    }

    seenJs.add(src);
    const file = resolveStaticUrl(src);
    js.push({ file: file ?? src, bytes: file ? (sizeOfFile(file) ?? 0) : 0 });
  }

  const seenCss = new Set<string>();
  for (const tag of readTags(html, 'link')) {
    const rel = readAttribute(tag, 'rel')?.toLowerCase() ?? '';
    const as = readAttribute(tag, 'as')?.toLowerCase() ?? '';
    const href = readAttribute(tag, 'href');

    if (!href) {
      continue;
    }

    if (rel.includes('stylesheet') && href.endsWith('.css') && !seenCss.has(href)) {
      seenCss.add(href);
      const file = resolveStaticUrl(href);
      css.push({ file: file ?? href, bytes: file ? (sizeOfFile(file) ?? 0) : 0 });
    }

    if (as === 'font' && !fonts.some((font) => font.file === href)) {
      const file = resolveStaticUrl(href);
      fonts.push({ file: file ?? href, bytes: file ? (sizeOfFile(file) ?? 0) : 0 });
    }
  }

  for (const tag of readTags(html, 'img')) {
    const src = readAttribute(tag, 'src');
    if (!src) {
      continue;
    }

    const file = resolveStaticUrl(src);
    images.push({ source: src, bytes: file ? sizeOfFile(file) : null });
  }

  return {
    route,
    status: answer.status,
    htmlBytes: Buffer.byteLength(html, 'utf8'),
    htmlGzipBytes: gzipSync(Buffer.from(html, 'utf8')).length,
    js,
    css,
    fonts,
    images,
    cacheControl: answer.headers.get('cache-control') ?? '',
  };
}

/**
 * Reads the header of the cache of an address.
 *
 * @param baseUrl The address of the server.
 * @param route The route to ask for.
 * @returns The header of the cache, or null when the address could not be
 *   asked for.
 */
async function readCacheHeader(
  baseUrl: string,
  route: string
): Promise<{ cacheControl: string; maxAge: number } | null> {
  try {
    const answer = await fetch(`${baseUrl}${route}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10_000),
    });

    const cacheControl = answer.headers.get('cache-control') ?? '';
    return { cacheControl, maxAge: readMaxAge(cacheControl) };
  } catch {
    return null;
  }
}

/**
 * Reads the header of the cache of the answer of a route of the API.
 *
 * The routes of the API answer to a POST and not to a HEAD, and the header of
 * the cache is on the answer itself. The request is made with an empty body,
 * so that the route refuses it before it does any work: no question reaches
 * the model and no form is sent.
 *
 * @param baseUrl The address of the server.
 * @param route The route to ask for.
 * @returns The status of the answer, the header of the cache and the number
 *   of seconds, or null when the route could not be asked for.
 */
async function readApiCache(
  baseUrl: string,
  route: string
): Promise<{ status: number; cacheControl: string; maxAge: number } | null> {
  try {
    const answer = await fetch(`${baseUrl}${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(15_000),
    });

    const cacheControl = answer.headers.get('cache-control') ?? '';
    return { status: answer.status, cacheControl, maxAge: readMaxAge(cacheControl) };
  } catch {
    return null;
  }
}

/**
 * Measures the whole site.
 *
 * @param baseUrl The address of the running site.
 * @returns Everything that was measured.
 */
async function measureSite(baseUrl: string): Promise<Measurement> {
  const measures: Record<string, number> = {};

  const staticFiles = listFiles(STATIC_DIR);
  const jsFiles = staticFiles.filter((file) => file.endsWith('.js'));
  const cssFiles = staticFiles.filter((file) => file.endsWith('.css'));
  const fontFiles = staticFiles.filter((file) => /\.(woff2?|ttf|otf)$/i.test(file));

  const toAsset = (file: string): Asset => ({
    file: path.relative(REPO_ROOT, file),
    bytes: sizeOfFile(file) ?? 0,
  });

  const buildJs = {
    files: jsFiles.map(toAsset),
    total: jsFiles.reduce((sum, file) => sum + (sizeOfFile(file) ?? 0), 0),
    largest:
      jsFiles.length === 0
        ? null
        : toAsset(
            jsFiles.reduce((biggest, file) =>
              (sizeOfFile(file) ?? 0) > (sizeOfFile(biggest) ?? 0) ? file : biggest
            )
          ),
  };

  const buildCss = {
    files: cssFiles.map(toAsset),
    total: cssFiles.reduce((sum, file) => sum + (sizeOfFile(file) ?? 0), 0),
  };

  const buildFonts = {
    files: fontFiles.map(toAsset),
    total: fontFiles.reduce((sum, file) => sum + (sizeOfFile(file) ?? 0), 0),
  };

  measures['build-client-js'] = buildJs.total;
  measures['build-largest-chunk'] = buildJs.largest?.bytes ?? 0;
  measures['build-css'] = buildCss.total;
  measures['build-font-files'] = buildFonts.files.length;
  measures['build-font-bytes'] = buildFonts.total;

  const { pages, dynamic } = discoverPages();
  const pagesMeasured: PageMeasurement[] = [];
  const skipped: { route: string; reason: string }[] = [];

  for (const route of dynamic) {
    skipped.push({
      route,
      reason: 'the page is made on every request and it needs a name that only the owner knows',
    });
  }

  for (const route of pages) {
    const page = await measurePage(baseUrl, route);

    if (!page) {
      skipped.push({ route, reason: 'the page did not answer' });
      continue;
    }

    pagesMeasured.push(page);

    const name = route === '/' ? 'home' : route.slice(1);
    measures[`first-load-js:${name}`] = page.js.reduce((sum, file) => sum + file.bytes, 0);
    measures[`css:${name}`] = page.css.reduce((sum, file) => sum + file.bytes, 0);
    measures[`preloaded-fonts:${name}`] = page.fonts.length;
    measures[`html-size:${name}`] = page.htmlBytes;
    measures[`html-gzip:${name}`] = page.htmlGzipBytes;
    measures[`images:${name}`] = page.images.length;
    measures[`cache-max-age:${name}`] = readMaxAge(page.cacheControl);
  }

  const publicCache: { file: string; cacheControl: string; maxAge: number }[] = [];

  for (const file of listFiles(PUBLIC_DIR)) {
    const relative = path.relative(PUBLIC_DIR, file).split(path.sep).join('/');
    const cache = await readCacheHeader(baseUrl, `/${relative}`);

    if (!cache) {
      continue;
    }

    publicCache.push({ file: relative, cacheControl: cache.cacheControl, maxAge: cache.maxAge });
    measures[`cache-max-age:public/${relative}`] = cache.maxAge;
  }

  const apiCache: { route: string; status: number; cacheControl: string; maxAge: number }[] = [];
  const siteFiles: { file: string; cacheControl: string; maxAge: number }[] = [];

  for (const route of API_ROUTES) {
    const cache = await readApiCache(baseUrl, route);

    if (!cache) {
      continue;
    }

    apiCache.push({
      route,
      status: cache.status,
      cacheControl: cache.cacheControl,
      maxAge: cache.maxAge,
    });
    measures[`cache-max-age:api${route.slice('/api'.length)}`] = cache.maxAge;
  }

  for (const route of SITE_FILES) {
    const cache = await readCacheHeader(baseUrl, route);

    if (!cache) {
      continue;
    }

    siteFiles.push({
      file: route.slice(1),
      cacheControl: cache.cacheControl,
      maxAge: cache.maxAge,
    });
    measures[`cache-max-age:file/${route.slice(1)}`] = cache.maxAge;
  }

  return {
    measures,
    buildJs,
    buildCss,
    buildFonts,
    pages: pagesMeasured,
    skipped,
    publicCache,
    apiCache,
    siteFiles,
  };
}

/**
 * Prints what was measured.
 *
 * @param measurement The measurement of the site.
 */
function printMeasurement(measurement: Measurement): void {
  console.log('=== Build ===');
  console.log(
    `  client JavaScript: ${formatBytes(measurement.buildJs.total)} in ${measurement.buildJs.files.length} files`
  );
  if (measurement.buildJs.largest) {
    console.log(
      `  biggest chunk: ${measurement.buildJs.largest.file} — ${formatBytes(measurement.buildJs.largest.bytes)}`
    );
  }
  console.log(
    `  CSS: ${formatBytes(measurement.buildCss.total)} in ${measurement.buildCss.files.length} files`
  );
  console.log(
    `  fonts: ${formatBytes(measurement.buildFonts.total)} in ${measurement.buildFonts.files.length} files`
  );
  console.log('');

  console.log('=== Pages ===');
  for (const page of measurement.pages) {
    const js = page.js.reduce((sum, file) => sum + file.bytes, 0);
    const css = page.css.reduce((sum, file) => sum + file.bytes, 0);
    const fonts = page.fonts.reduce((sum, file) => sum + file.bytes, 0);

    console.log(`  ${page.route} (${page.status})`);
    console.log(`    JavaScript of the first load: ${formatBytes(js)} in ${page.js.length} files`);
    console.log(`    CSS: ${formatBytes(css)}`);
    console.log(`    fonts preloaded: ${page.fonts.length} — ${formatBytes(fonts)}`);
    console.log(
      `    HTML: ${formatBytes(page.htmlBytes)} — ${formatBytes(page.htmlGzipBytes)} compressed`
    );
    console.log(`    pictures: ${page.images.length}`);
  }
  console.log('');

  if (measurement.skipped.length > 0) {
    console.log('=== Not measured ===');
    for (const entry of measurement.skipped) {
      console.log(`  ${entry.route} — ${entry.reason}`);
    }
    console.log('');
  }

  console.log('=== Cache ===');
  for (const page of measurement.pages) {
    console.log(`  ${page.route} — ${page.cacheControl || 'no cache header'}`);
  }
  for (const entry of measurement.publicCache) {
    const note = entry.maxAge === 0 ? '  ← asked for on every visit' : '';
    console.log(`  public/${entry.file} — ${entry.cacheControl || 'no cache header'}${note}`);
  }
  for (const entry of measurement.siteFiles) {
    const note = entry.maxAge === 0 ? '  ← asked for on every visit' : '';
    console.log(`  ${entry.file} — ${entry.cacheControl || 'no cache header'}${note}`);
  }
  for (const entry of measurement.apiCache) {
    const note = entry.cacheControl ? '' : '  ← the answer is not marked';
    console.log(
      `  POST ${entry.route} (${entry.status}) — ${entry.cacheControl || 'no cache header'}${note}`
    );
  }
  console.log('');
}

/**
 * Runs the measurement and prints the result.
 */
async function main(): Promise<void> {
  if (!existsSync(BUILD_DIR)) {
    console.error(`There is no build in ${BUILD_DIR}.`);
    console.error('Run `npm run build` before this script.');
    process.exit(1);
  }

  const externalUrl = process.env.PERF_BASE_URL;
  let baseUrl = externalUrl ?? '';
  let stop: (() => void) | null = null;

  if (!externalUrl) {
    const port = Number(process.env.PERF_PORT ?? DEFAULT_PORT);
    const server = await startServer(port);

    if (!server) {
      console.error('The server of the build could not be started.');
      console.error(
        'The numbers of the build can still be read: run the script again with PERF_BASE_URL pointing at a running site.'
      );
      process.exit(1);
    }

    baseUrl = server.baseUrl;
    stop = server.stop;
  }

  try {
    const measurement = await measureSite(baseUrl);
    printMeasurement(measurement);

    const evaluation = evaluateBudgets(measurement.measures, PERFORMANCE_BUDGETS);
    const checked = Object.keys(PERFORMANCE_BUDGETS).filter((name) => name in measurement.measures);

    console.log('=== SUMMARY ===');
    console.log(`Measures read: ${Object.keys(measurement.measures).length}`);
    console.log(`Rules checked: ${checked.length}`);
    console.log(`Rules passed: ${checked.length - evaluation.failures.length}`);
    console.log(`Rules failed: ${evaluation.failures.length}`);
    console.log(`Measures without a budget: ${evaluation.withoutBudget.length}`);

    if (evaluation.withoutBudget.length > 0) {
      console.log('');
      console.log('=== MEASURES WITHOUT A BUDGET ===');
      for (const name of evaluation.withoutBudget) {
        console.log(`  ${name}: ${evaluation.measured[name]}`);
      }
    }

    if (evaluation.failures.length > 0) {
      console.log('');
      console.log('=== FAILED RULES ===');
      for (const failure of evaluation.failures) {
        const direction = failure.kind === 'atMost' ? 'the ceiling is' : 'the floor is';
        const value =
          failure.unit === 'bytes'
            ? formatBytes(failure.measured)
            : failure.unit === 'seconds'
              ? formatSeconds(failure.measured)
              : `${failure.measured} ${failure.unit}`;
        const allowed =
          failure.unit === 'bytes'
            ? formatBytes(failure.limit)
            : failure.unit === 'seconds'
              ? formatSeconds(failure.limit)
              : `${failure.limit} ${failure.unit}`;

        console.log(`  ✗ ${failure.name}: ${value} — ${direction} ${allowed}`);
      }
    }

    process.exit(evaluation.failures.length > 0 ? 1 : 0);
  } finally {
    stop?.();
  }
}

main().catch((error) => {
  console.error('The measurement failed:', error);
  process.exit(1);
});
