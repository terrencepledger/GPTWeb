import { createClient } from '@sanity/client';

// Prefer NEXT_PUBLIC_* for the app/browser, but allow SANITY_STUDIO_* on the server
const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID;
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || 'production';

if (!projectId) {
  throw new Error(
    'Sanity projectId is missing. Set NEXT_PUBLIC_SANITY_PROJECT_ID (for the app) or SANITY_STUDIO_PROJECT_ID (for server/Studio).'
  );
}

export const sanity = createClient({
  projectId,
  dataset,
  apiVersion: '2025-08-01',
  useCdn: true,
});
