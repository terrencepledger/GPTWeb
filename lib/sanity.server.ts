import {createClient} from '@sanity/client';

const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID;

const dataset =
  process.env.SANITY_STUDIO_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_DATASET;

const token =
  process.env.SANITY_WRITE_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN ||
  process.env.SANITY_API_TOKEN ||
  process.env.SANITY_READ_TOKEN;

let cachedClient: ReturnType<typeof createClient> | null = null;

export function getSanityWriteClient() {
  if (cachedClient) {
    return cachedClient;
  }

  if (!projectId || !dataset) {
    throw new Error(
      'Missing Sanity project configuration. Please set SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET.'
    );
  }

  if (!token) {
    throw new Error(
      'A Sanity API token with write permissions is required. Set SANITY_WRITE_TOKEN (or SANITY_API_TOKEN).' 
    );
  }

  cachedClient = createClient({
    projectId,
    dataset,
    apiVersion: '2025-08-01',
    useCdn: false,
    token,
    perspective: 'published',
  });

  return cachedClient;
}

export function hasSanityWriteToken() {
  return Boolean(token);
}
