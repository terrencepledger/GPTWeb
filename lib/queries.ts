import groq from 'groq';
import {sanity} from './sanity';

export interface HeroSlide {
  _id: string;
  headline: string;
  subline?: string;
  cta?: {
    label?: string;
    href?: string;
  };
  image?: string;
}

export const heroSlides = () =>
  sanity.fetch<HeroSlide[]>(
    groq`*[_type == "heroSlide"] | order(_createdAt asc){
      _id,
      headline,
      subline,
      "cta": cta{label, href},
      "image": coalesce(backgroundImage.asset->url, image.asset->url)
    }`
  );

export interface Staff {
  _id: string;
  name: string;
  role: string;
  image?: string;
}

export const staffAll = () =>
  sanity.fetch<Staff[]>(
    groq`*[_type == "staff"] | order(name asc){_id, name, role, "image": image.asset->url}`
  );

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  publishedAt: string;
  cta?: { label: string; href: string };
}

export const announcementLatest = () =>
  sanity.fetch<Announcement | null>(
    groq`*[_type == "announcement"] | order(publishedAt desc)[0]{_id, title, "message": body, publishedAt, cta{label, href}}`
  );

export interface SocialLink {
  label: string;
  href: string;
  description?: string;
  icon: string;
}

export interface SiteSettings {
  _id: string;
  title: string;
  address?: string;
  serviceTimes?: string;
  logo?: string;
  socialLinks?: SocialLink[];
  youtubeChannelId?: string;
  vimeoUserId?: string;
  vimeoAccessToken?: string;
}

export const siteSettings = () =>
  sanity.fetch<SiteSettings | null>(
    groq`*[_id == "siteSettings"][0]{_id, title, address, serviceTimes, youtubeChannelId, vimeoUserId, vimeoAccessToken, "logo": logo.asset->url, "socialLinks": socialLinks[]{label, href, description, icon}}`
  );

export interface Ministry {
  _id: string;
  name: string;
  description: string;
  staffImage?: string;
}

export const ministriesHighlights = (limit: number) =>
  sanity.fetch<Ministry[]>(
    groq`*[_type == "ministry"] | order(_createdAt desc)[0...$limit]{_id, name, description, "staffImage": staffImage.asset->url}`,
    {limit},
  );

export const ministriesAll = () =>
  sanity.fetch<Ministry[]>(
    groq`*[_type == "ministry"] | order(name asc){_id, name, description, "staffImage": staffImage.asset->url}`
  );

export interface MissionStatement {
  _id: string;
  headline: string;
  tagline?: string;
  backgroundImage?: string;
  message?: string;
}

export const missionStatement = () =>
  sanity.fetch<MissionStatement | null>(
    groq`*[_type == "missionStatement"][0]{
      _id,
      headline,
      tagline,
      "backgroundImage": backgroundImage.asset->url,
      message
    }`
  );

export interface EventDetailLink {
  calendarEventId: string;
  slug: string;
}

export const eventDetailLinks = () =>
  sanity.fetch<EventDetailLink[]>(
    groq`*[_type == "eventDetail"]{calendarEventId, "slug": slug.current}`
  );

export interface EventDetail {
  _id: string;
  title: string;
  calendarEventId: string;
  body?: any;
  palette?: { primary?: string; accent?: string; contrast?: string };
  eventLogo?: { url: string; alt?: string };
  sections?: (
    | { _type: 'heroSection'; headline?: string; subheadline?: string; backgroundImage?: string }
    | { _type: 'gallerySection'; layout?: string; images: { _key: string; url: string; alt?: string }[] }
    | { _type: 'calendarSection'; showSubscribe?: boolean }
    | { _type: 'mapSection'; address?: string; mapType?: string }
    | { _type: 'registrationSection'; formUrl?: string }
  )[];
}

export const eventDetailBySlug = (slug: string, preview = false) => {
  const client = preview
    ? sanity.withConfig({
        fetch: globalThis.fetch,
        useCdn: false,
        perspective: 'previewDrafts',
        token: process.env.SANITY_READ_TOKEN,
      })
    : sanity;
  return client.fetch<EventDetail | null>(
    groq`*[_type == "eventDetail" && slug.current == $slug][0]{
      _id,
      title,
      calendarEventId,
      body,
      palette{primary, accent, contrast},
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
        _type == 'calendarSection' => { _type, showSubscribe },
        _type == 'mapSection' => { _type, address, mapType },
        _type == 'registrationSection' => { _type, formUrl }
      }
    }`,
    { slug }
  );
};

