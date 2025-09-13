import { defineField, defineType } from 'sanity';
import CalendarEventIdInput from '../components/CalendarEventIdInput';

const lightPrimaryOptions = [
  { title: 'Purple', value: 'purple' },
  { title: 'Gold', value: 'gold' },
  { title: 'White', value: 'white' },
];
const lightAccentOptions = [
  { title: 'Gold', value: 'gold' },
  { title: 'Purple', value: 'purple' },
  { title: 'Ink (Dark Text)', value: 'ink' },
  { title: 'White', value: 'white' },
];
const lightContrastOptions = [
  { title: 'Ink (Dark Text)', value: 'ink' },
  { title: 'White', value: 'white' },
  { title: 'Purple', value: 'purple' },
];

const darkPrimaryOptions = [
  { title: 'Black', value: 'black' },
  { title: 'Gray', value: 'gray' },
  { title: 'Dark Red', value: 'darkred' },
];
const darkAccentOptions = [
  { title: 'Gold', value: 'gold' },
  { title: 'Purple', value: 'purple' },
  { title: 'White', value: 'white' },
];
const darkContrastOptions = [
  { title: 'Gold', value: 'gold' },
  { title: 'White', value: 'white' },
];

export default defineType({
  name: 'eventDetail',
  title: 'Event Detail',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'calendarEventId',
      title: 'Calendar Event',
      type: 'string',
      components: { input: CalendarEventIdInput },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'palette',
      title: 'Color Palette',
      type: 'object',
      fields: [
        // Legacy flat fields (kept for backward compatibility on older docs)
        defineField({ name: 'primary', title: 'Primary (Legacy)', type: 'string', options: { list: [...lightPrimaryOptions, ...darkPrimaryOptions] } }),
        defineField({ name: 'accent', title: 'Accent (Legacy)', type: 'string', options: { list: [...lightAccentOptions, ...darkAccentOptions] } }),
        defineField({ name: 'contrast', title: 'Contrast (Legacy)', type: 'string', options: { list: [...lightContrastOptions, ...darkContrastOptions] } }),
        // New structured per-mode fields
        defineField({
          name: 'light',
          title: 'Light Mode',
          type: 'object',
          fields: [
            defineField({ name: 'primary', title: 'Primary', type: 'string', options: { list: lightPrimaryOptions } }),
            defineField({ name: 'accent', title: 'Accent', type: 'string', options: { list: lightAccentOptions } }),
            defineField({ name: 'contrast', title: 'Contrast', type: 'string', options: { list: lightContrastOptions } }),
          ],
        }),
        defineField({
          name: 'dark',
          title: 'Dark Mode',
          type: 'object',
          fields: [
            defineField({ name: 'primary', title: 'Primary', type: 'string', options: { list: darkPrimaryOptions } }),
            defineField({ name: 'accent', title: 'Accent', type: 'string', options: { list: darkAccentOptions } }),
            defineField({ name: 'contrast', title: 'Contrast', type: 'string', options: { list: darkContrastOptions } }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'eventLogo',
      title: 'Event Logo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [
        { type: 'heroSection' },
        { type: 'gallerySection' },
        { type: 'calendarSection' },
        { type: 'mapSection' },
        { type: 'registrationSection' },
      ],
    }),
  ],
});
