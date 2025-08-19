import {groq} from 'next-sanity';
import {sanity} from './sanity';

export interface Event {
  _id: string;
  title: string;
  date: string;
  slug: {current: string};
}

export const eventsUpcoming = (limit: number) =>
  sanity.fetch<Event[]>(
    groq`*[_type == "event" && date >= now()] | order(date asc)[0...$limit]{_id, title, date, slug}`,
    {limit}
  );

export interface Sermon {
  _id: string;
  title: string;
  date: string;
  slug: {current: string};
  videoUrl?: string;
}

export const sermonLatest = () =>
  sanity.fetch<Sermon>(
    groq`*[_type == "sermon"] | order(date desc)[0]{_id, title, date, slug, videoUrl}`
  );

export const sermonsPage = (offset: number, limit: number) =>
  sanity.fetch<Sermon[]>(
    groq`*[_type == "sermon"] | order(date desc)[$offset...$end]{_id, title, date, slug, videoUrl}`,
    {offset, end: offset + limit}
  );

export interface Staff {
  _id: string;
  name: string;
  role: string;
  image?: any;
}

export const staffAll = () =>
  sanity.fetch<Staff[]>(
    groq`*[_type == "staff"] | order(name asc){_id, name, role, image}`
  );

export interface Announcement {
  _id: string;
  message: string;
  active: boolean;
}

export const announcementActive = () =>
  sanity.fetch<Announcement | null>(
    groq`*[_type == "announcement" && active == true][0]{_id, message, active}`
  );

export interface SiteSettings {
  _id: string;
  title: string;
  description?: string;
}

export const siteSettings = () =>
  sanity.fetch<SiteSettings>(
    groq`*[_type == "siteSettings"][0]{_id, title, description}`
  );

