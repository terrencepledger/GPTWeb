import { createClient } from '@sanity/client';

// Use the single canonical env variable names defined in .env.local
const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;

// Optional read token (single canonical name)
const token = process.env.SANITY_READ_TOKEN;

const useCdn = false; // Always disable CDN to ensure fresh data

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-08-01',
  useCdn,
  token,
  // If a read token is configured, allow fetching drafts as well (useful for preview and staging)
  perspective: token ? 'previewDrafts' : 'published',
});

// One-time init log to aid debugging env issues
try {
  // eslint-disable-next-line no-console
  console.log('[Sanity] Client init:', {
    projectId,
    dataset,
    useCdn,
    hasToken: Boolean(token),
  });
} catch {}

const originalFetch = client.fetch.bind(client);

function truncateString(input: string, max = 500) {
  if (!input) return input;
  return input.length > max ? input.slice(0, max) + '…(truncated)' : input;
}

function safePreview(value: unknown, maxLen = 2000): string {
  try {
    const seen = new WeakSet();
    const json = JSON.stringify(
      value,
      (key, val) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val as object)) return '[Circular]';
          seen.add(val as object);
        }
        if (typeof val === 'string') {
          return truncateString(val, 200);
        }
        return val;
      }
    );
    return truncateString(json ?? String(value), maxLen);
  } catch {
    try {
      return truncateString(String(value), maxLen);
    } catch {
      return '[Unserializable]';
    }
  }
}

client.fetch = (query: any, params?: Record<string, unknown>, options?: any) => {
  const ts = new Date().toISOString();
  const qStr = typeof query === 'string' ? query : String(query);
  const pPreview = params ? safePreview(params, 1000) : undefined;

  const promise = originalFetch(query as any, params as any, options as any);
  return promise
    .then((result: unknown) => {
      try {
        const isArray = Array.isArray(result);
        // eslint-disable-next-line no-console
        console.log('[Sanity][fetch]', {
          ts,
          query: truncateString(qStr, 800),
          params: pPreview,
          resultType: isArray ? 'array' : typeof result,
          resultCount: isArray ? (result as unknown[]).length : undefined,
          resultPreview: safePreview(result, 2000),
        });
      } catch {}
      return result as any;
    })
    .catch((err: unknown) => {
      try {
        // eslint-disable-next-line no-console
        console.error('[Sanity][fetch][error]', {
          ts,
          query: truncateString(qStr, 800),
          params: pPreview,
          error: String(err),
        });
      } catch {}
      throw err;
    });
};

export const sanity = client;
