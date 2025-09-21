import groq from 'groq';
import type {PortableTextBlock} from 'sanity';
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

export interface GivingOption {
  title: string;
  content: string;
  href?: string;
}

export interface SiteSettings {
  _id: string;
  title: string;
  address?: string;
  serviceTimes?: string;
  email?: string;
  phone?: string;
  logo?: string;
  socialLinks?: SocialLink[];
  givingOptions?: GivingOption[];
}

export const siteSettings = () =>
  sanity.fetch<SiteSettings | null>(
    groq`*[_id == "siteSettings"][0]{
      _id,
      title,
      email,
      phone,
      address,
      serviceTimes,
      "logo": logo.asset->url,
      "socialLinks": socialLinks[]{label, href, description, icon},
      "givingOptions": givingOptions[]{title, content, href}
    }`
  );

export interface FormSettings {
  _id: string;
  formId?: string;
  pageId?: string;
}

export const contactFormSettings = () =>
  sanity.fetch<FormSettings | null>(
    groq`*[_type == "formSettings" && page->slug.current == "contact"][0]{
      _id,
      formId,
      "pageId": page._ref
    }`
  );

export const prayerRequestFormSettings = () =>
  sanity.fetch<FormSettings | null>(
    groq`*[_type == "formSettings" && page->slug.current == "contact-prayer-requests"][0]{
      _id,
      formId,
      "pageId": page._ref
    }`
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

export interface MeetPastorQuote {
  text?: string;
  attribution?: string;
}

export interface MeetPastorSection {
  heading?: string;
  body?: PortableTextBlock[];
  image?: string;
  imageAlt?: string;
  values?: string[];
  highlights?: string[];
  quote?: MeetPastorQuote;
}

export interface MeetPastorMediaItem {
  _key: string;
  title?: string;
  description?: string;
  label?: string;
  url?: string;
}

export interface MeetPastorContactMethod {
  _key: string;
  label?: string;
  value?: string;
  href?: string;
}

export interface MeetPastorTimelineEntry {
  _key: string;
  date?: string;
  title?: string;
  description?: string;
}

export interface MeetPastorTestimonial {
  _key: string;
  quote?: string;
  name?: string;
  role?: string;
}

export interface MeetPastorData {
  hero?: {
    title?: string;
    subtitle?: string;
    tagline?: string;
    image?: string;
    imageAlt?: string;
  };
  quickFacts?: { label?: string; value?: string }[];
  highlightQuote?: MeetPastorQuote;
  biographySection?: MeetPastorSection;
  visionSection?: MeetPastorSection;
  personalSection?: MeetPastorSection;
  mediaSection?: {
    heading?: string;
    intro?: PortableTextBlock[];
    items?: MeetPastorMediaItem[];
  };
  connectSection?: {
    heading?: string;
    body?: PortableTextBlock[];
    cta?: { label?: string; href?: string };
    contactMethods?: MeetPastorContactMethod[];
  };
  timeline?: MeetPastorTimelineEntry[];
  testimonials?: MeetPastorTestimonial[];
}

export const meetPastorPage = () =>
  sanity.fetch<MeetPastorData | null>(
    groq`*[_type == "meetPastor"][0]{
      "hero": hero{
        title,
        subtitle,
        tagline,
        "image": image.asset->url,
        imageAlt
      },
      "quickFacts": quickFacts[]{label, value},
      "highlightQuote": highlightQuote{ text, attribution },
      "biographySection": biographySection{
        heading,
        body,
        "image": image.asset->url,
        imageAlt
      },
      "visionSection": visionSection{
        heading,
        body,
        values,
        quote{ text, attribution }
      },
      "personalSection": personalSection{
        heading,
        body,
        "image": image.asset->url,
        imageAlt,
        highlights
      },
      "mediaSection": mediaSection{
        heading,
        intro,
        items[]{
          _key,
          title,
          description,
          label,
          url
        }
      },
      "connectSection": connectSection{
        heading,
        body,
        cta{ label, href },
        contactMethods[]{
          _key,
          label,
          value,
          href
        }
      },
      "timeline": timeline[]{
        _key,
        date,
        title,
        description
      },
      "testimonials": testimonials[]{
        _key,
        quote,
        name,
        role
      }
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
  eventDate?: string;
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
      eventDate,
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

