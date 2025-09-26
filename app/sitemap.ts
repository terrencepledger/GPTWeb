import type {MetadataRoute} from 'next';

const DEFAULT_SITE_URL = 'https://gptchurch.org';

function getSiteUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_ORIGIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_BASE_URL;

  const normalized = envUrl?.replace(/\/$/, '') || DEFAULT_SITE_URL;
  return normalized;
}

const STATIC_PATHS: readonly string[] = [
  '/',
  '/about/beliefs',
  '/about/mission-statement',
  '/about/staff',
  '/building-use',
  '/contact',
  '/contact/prayer-requests',
  '/events',
  '/faq',
  '/giving',
  '/livestreams',
  '/ministries',
  '/newsletter',
  '/privacy',
  '/services',
  '/terms',
  '/visit',
  '/volunteer',
];

async function getEventEntries(
  siteUrl: string,
  lastModified: Date
): Promise<MetadataRoute.Sitemap> {
  const hasSanityConfig =
    Boolean(process.env.SANITY_STUDIO_PROJECT_ID) &&
    Boolean(process.env.SANITY_STUDIO_DATASET);

  if (!hasSanityConfig) {
    return [];
  }

  try {
    const {eventDetailLinks} = await import('@/lib/queries');
    const links = await eventDetailLinks();
    return links
      .filter((link) => Boolean(link.slug))
      .map((link) => ({
        url: `${siteUrl}/events/${link.slug}`,
        lastModified,
      }));
  } catch (error) {
    try {
      // eslint-disable-next-line no-console
      console.error('[sitemap] Failed to load event slugs', error);
    } catch {}
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
  }));

  const eventEntries = await getEventEntries(siteUrl, lastModified);

  return [...staticEntries, ...eventEntries];
}
