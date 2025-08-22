import groq from 'groq';
import {sanity} from './sanity';

export interface Event {
  _id: string;
  title: string;
  date: string;
  description: string;
  location?: string;
  image?: string;
}

export const eventsUpcoming = (limit: number) => {
  const now = new Date().toISOString();
  return sanity.fetch<Event[]>(
    groq`*[_type == "event" && date >= $now] | order(date asc)[0...$limit]{_id, title, date, description, location, "image": image.asset->url}`,
    { limit, now }
  );
}

export const eventsAll = () =>
  sanity.fetch<Event[]>(
    groq`*[_type == "event"] | order(date asc){_id, title, date, description, location, "image": image.asset->url}`
  );

export interface Sermon {
  _id: string;
  title: string;
  speaker: string;
  passage?: string;
}

export const sermonLatest = () =>
  sanity.fetch<Sermon | null>(
    groq`*[_type == "sermon"] | order(_createdAt desc)[0]{_id, title, speaker, "passage": scripture}`
  );

export const sermonsPage = (offset: number, limit: number) =>
  sanity.fetch<Sermon[]>(
    groq`*[_type == "sermon"] | order(_createdAt desc)[$offset...$end]{_id, title, speaker, "passage": scripture}`,
    {offset, end: offset + limit}
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
}

export const announcementLatest = () =>
  sanity.fetch<Announcement | null>(
    groq`*[_type == "announcement"] | order(publishedAt desc)[0]{_id, title, "message": body, publishedAt}`
  );

export interface SiteSettings {
  _id: string;
  title: string;
  description?: string;
  address?: string;
  serviceTimes?: string;
  logo?: string;
}

export const siteSettings = () =>
  sanity.fetch<SiteSettings | null>(
    groq`*[_type == "siteSettings"][0]{_id, title, description, address, serviceTimes, "logo": logo.asset->url}`
  );

export interface Ministry {
  _id: string;
  name: string;
  description: string;
  image?: string;
}

export const ministriesHighlights = (limit: number) =>
  sanity.fetch<Ministry[]>(
    groq`*[_type == "ministry"] | order(_createdAt desc)[0...$limit]{_id, name, description, "image": image.asset->url}`,
    {limit}
  );

export const ministriesAll = () =>
  sanity.fetch<Ministry[]>(
    groq`*[_type == "ministry"] | order(name asc){_id, name, description, "image": image.asset->url}`
  );

