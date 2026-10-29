import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  trackCtaClicked,
  getSessionId,
  getAnalyticsConfig,
  ANALYTICS_ENDPOINT,
} from './client.ts';
import type { AnalyticsConfig } from './eventTypes.ts';

const SESSION_ID = '0e0aa843-c3d5-48f2-a407-ccb65152203a';
const QUERY_ID = '6b1f5c9e-2a4d-4c8b-9e3f-1d2c3b4a5e6f';

/**
 * A configuration with the tracking on and nothing written to the console.
 */
const ENABLED_CONFIG: AnalyticsConfig = {
  enabled: true,
  logToConsole: false,
};

/**
 * The storage of a browser tab.
 */
class MemoryStorage {
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }
}

const originalFetch = globalThis.fetch;
const originalWindow = (globalThis as { window?: unknown }).window;

/**
 * Replaces the fetch of the runtime with one that records the call.
 *
 * @param status The status the answer carries.
 */
function stubFetch(status = 200) {
  const calls: Array<{ url: string; init: RequestInit }> = [];

  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), init });
    return {
      ok: status >= 200 && status < 300,
      status,
    } as Response;
  }) as typeof fetch;

  return calls;
}

/**
 * Collects what is written to the console while the function runs.
 */
async function captureConsole<T>(
  run: () => Promise<T>
): Promise<{ result: T; warnings: string[] }> {
  const warnings: string[] = [];
  const originalWarn = console.warn;

  console.warn = (...args: unknown[]) => {
    warnings.push(args.map((arg) => String(arg)).join(' '));
  };

  try {
    const result = await run();
    return { result, warnings };
  } finally {
    console.warn = originalWarn;
  }
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  (globalThis as { window?: unknown }).window = originalWindow;
});

test('a click is sent to the endpoint of the site', async () => {
  const calls = stubFetch(200);

  await trackCtaClicked(
    SESSION_ID,
    QUERY_ID,
    'linkedin',
    'linkedin.com',
    ENABLED_CONFIG
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, ANALYTICS_ENDPOINT);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(
    (calls[0].init.headers as Record<string, string>)['Content-Type'],
    'application/json'
  );
});

test('the request is kept alive so it goes out when the page goes away', async () => {
  const calls = stubFetch(200);

  await trackCtaClicked(
    SESSION_ID,
    QUERY_ID,
    'linkedin',
    'linkedin.com',
    ENABLED_CONFIG
  );

  assert.equal(calls[0].init.keepalive, true);
});

test('the payload holds the four fields and nothing else', async () => {
  const calls = stubFetch(200);

  await trackCtaClicked(
    SESSION_ID,
    QUERY_ID,
    'linkedin',
    'linkedin.com',
    ENABLED_CONFIG
  );

  const body = JSON.parse(String(calls[0].init.body));

  assert.deepEqual(body, {
    eventType: 'cta_clicked',
    sessionId: SESSION_ID,
    queryId: QUERY_ID,
    ctaType: 'linkedin',
    targetDomain: 'linkedin.com',
  });
});

test('the payload does not carry a moment of its own', async () => {
  const calls = stubFetch(200);

  await trackCtaClicked(
    SESSION_ID,
    QUERY_ID,
    'linkedin',
    'linkedin.com',
    ENABLED_CONFIG
  );

  const body = JSON.parse(String(calls[0].init.body));

  // The server puts the moment on the event, with the clock that counts.
  assert.equal('timestamp' in body, false);
});

test('an answer of 200 is not a problem', async () => {
  stubFetch(200);

  const { warnings } = await captureConsole(async () => {
    await trackCtaClicked(
      SESSION_ID,
      QUERY_ID,
      'linkedin',
      'linkedin.com',
      ENABLED_CONFIG
    );
  });

  assert.equal(warnings.length, 0);
});

test('an answer of 400 is reported but does not throw', async () => {
  stubFetch(400);

  const { warnings } = await captureConsole(async () => {
    await trackCtaClicked(
      SESSION_ID,
      QUERY_ID,
      'linkedin',
      'linkedin.com',
      ENABLED_CONFIG
    );
  });

  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /CTA tracking failed/);
  assert.match(warnings[0], /400/);
});

test('an answer of 429 is reported but does not throw', async () => {
  stubFetch(429);

  const { warnings } = await captureConsole(async () => {
    await trackCtaClicked(
      SESSION_ID,
      QUERY_ID,
      'linkedin',
      'linkedin.com',
      ENABLED_CONFIG
    );
  });

  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /429/);
});

test('an answer of 500 is reported but does not throw', async () => {
  stubFetch(500);

  const { warnings } = await captureConsole(async () => {
    await trackCtaClicked(
      SESSION_ID,
      QUERY_ID,
      'linkedin',
      'linkedin.com',
      ENABLED_CONFIG
    );
  });

  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /500/);
});

test('a failure of the network is reported but does not throw', async () => {
  globalThis.fetch = (async () => {
    throw new Error('the network is gone');
  }) as typeof fetch;

  const { warnings } = await captureConsole(async () => {
    await trackCtaClicked(
      SESSION_ID,
      QUERY_ID,
      'linkedin',
      'linkedin.com',
      ENABLED_CONFIG
    );
  });

  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /CTA tracking error/);
});

test('nothing is sent when the tracking is turned off', async () => {
  const calls = stubFetch(200);

  await trackCtaClicked(SESSION_ID, QUERY_ID, 'linkedin', 'linkedin.com', {
    enabled: false,
    logToConsole: false,
  });

  assert.equal(calls.length, 0);
});

test('the session is the same for the same visitor', () => {
  const first = getSessionId('client-1');
  const second = getSessionId('client-1');

  assert.equal(first, second);
});

test('the session of one visitor is not the session of another', () => {
  const first = getSessionId('client-1');
  const second = getSessionId('client-2');

  assert.notEqual(first, second);
});

test('the session is kept in the storage of the tab', () => {
  const storage = new MemoryStorage();
  (globalThis as { window?: unknown }).window = { sessionStorage: storage };

  const first = getSessionId('client-1');
  const second = getSessionId('client-1');

  assert.equal(first, second);
  assert.equal(storage.getItem('analytics-session:client-1'), first);
});

test('a session that is already in the storage of the tab is used', () => {
  const storage = new MemoryStorage();
  storage.setItem('analytics-session:client-1', SESSION_ID);
  (globalThis as { window?: unknown }).window = { sessionStorage: storage };

  assert.equal(getSessionId('client-1'), SESSION_ID);
});

test('a storage that is refused falls back to the memory', () => {
  (globalThis as { window?: unknown }).window = {
    sessionStorage: {
      getItem() {
        throw new Error('the storage is refused');
      },
      setItem() {
        throw new Error('the storage is refused');
      },
    },
  };

  const first = getSessionId('client-1');
  const second = getSessionId('client-1');

  assert.equal(first, second);
});

test('the browser sends the events to the server of the site', () => {
  (globalThis as { window?: unknown }).window = { sessionStorage: new MemoryStorage() };

  const config = getAnalyticsConfig();

  // The browser cannot know whether the server has the credentials, so it
  // sends the events and the server decides what happens with them.
  assert.equal(config.enabled, true);
});

test('the server only sends the events when it has the credentials', () => {
  (globalThis as { window?: unknown }).window = undefined;

  // The environment of the machine that runs the tests is cleared for this
  // one, so the answer does not depend on what the shell of the developer
  // happens to carry.
  const originalKey = process.env.POSTHOG_KEY;
  const originalHost = process.env.POSTHOG_HOST;
  delete process.env.POSTHOG_KEY;
  delete process.env.POSTHOG_HOST;

  try {
    assert.equal(getAnalyticsConfig().enabled, false);
  } finally {
    if (originalKey !== undefined) process.env.POSTHOG_KEY = originalKey;
    if (originalHost !== undefined) process.env.POSTHOG_HOST = originalHost;
  }
});
