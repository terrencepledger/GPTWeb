import { createClient } from '@sanity/client';

// Use the single canonical env variable names defined in .env.local
const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;

// Optional read token (single canonical name)
const token = process.env.SANITY_READ_TOKEN;

const useCdn = !token; // Disable CDN if using a token to ensure fresh, authorized data

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-08-01',
  useCdn,
  token,
  perspective: 'published',
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

// Wrap fetch to log results (not queries) for debugging purposes
const originalFetch = client.fetch.bind(client);
client.fetch = (query: any, params?: Record<string, unknown>, options?: any) => {
  const promise = originalFetch(query as any, params as any, options as any);
  return promise
    .then((result: unknown) => {
      try {
        // eslint-disable-next-line no-console
        console.log('[Sanity] Result:', result);
      } catch {}
      return result as any;
    })
    .catch((err: unknown) => {
      try {
        // eslint-disable-next-line no-console
        console.error('[Sanity] Fetch error:', err);
      } catch {}
      throw err;
    });
};

export const sanity = client;
