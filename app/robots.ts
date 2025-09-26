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

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
