import groq from "groq";
import { sanity } from "./sanity";

export const siteSettings = async () => {
  return sanity.fetch(
    groq`*[_type == "siteSettings"][0]{
      title,
      description,
      "logo": logo.asset->url,
      "favicon": favicon.asset->url
    }`
  );
};

export interface EventDetail {
  _id: string;
  title: string;
  calendarEventId: string;
  body?: any;
  palette?: {
    light?: { primary?: string; accent?: string; contrast?: string };
    dark?: { primary?: string; accent?: string; contrast?: string };
  };
  eventLogo?: { url: string; alt?: string };
  sections?: (
    | { _type: 'heroSection'; headline?: string; subheadline?: string; backgroundImage?: string }
    | { _type: 'gallerySection'; layout?: string; images: { _key: string; url: string; alt?: string }[] }
    | { _type: 'subscriptionSection'; showSubscribe?: boolean }
    | { _type: 'mapSection'; address?: string; mapType?: string }
    | { _type: 'linkSection'; linkText?: string; url?: string }
  )[];
}

export const eventDetailBySlug = (slug: string, preview = false) => {
  const client = preview
    ? sanity.withConfig({
        useCdn: false,
        perspective: 'previewDrafts',
        token: process.env.SANITY_READ_TOKEN || process.env.SANITY_API_TOKEN,
        // Ensure no caching in preview so drafts reflect immediately
        fetch: (url: any, init?: RequestInit) => fetch(url, { ...(init || {}), cache: 'no-store' }),
      } as any)
    : sanity;
  return client.fetch<EventDetail | null>(
    groq`*[_type == "eventDetail" && slug.current == $slug][0]{
      _id,
      title,
      calendarEventId,
      body,
      palette{
        light{primary, accent, contrast},
        dark{primary, accent, contrast}
      },
      "eventLogo": eventLogo{ "url": asset->url, "alt": coalesce(alt, "") },
      sections[]{
        _type == 'heroSection' => {
          _type,
          headline,
          subheadline,
          "backgroundImage": backgroundImage.asset->url
        },
        _type == 'gallerySection' => {
          _type,
          layout,
          "images": images[]{ _key, "url": asset->url, "alt": coalesce(alt, "") }
        },
        _type == 'subscriptionSection' => { _type, showSubscribe },
        _type == 'mapSection' => { _type, address, mapType },
        _type == 'linkSection' => { _type, linkText, url }
      }
    }`,
    { slug }
  );
};
