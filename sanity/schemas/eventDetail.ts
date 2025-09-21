import { defineType, defineField } from 'sanity';
import CalendarEventIdInput from '../components/CalendarEventIdInput';

export default defineType({
  name: 'eventDetail',
  title: 'Event Detail',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'calendarEventId',
      title: 'Calendar Event',
      type: 'string',
      components: { input: CalendarEventIdInput },
    }),
    defineField({
      name: 'eventDate',
      title: 'Event Date',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'palette',
      title: 'Palette',
      type: 'object',
      initialValue: {
        light: { primary: 'purple', accent: 'gold', contrast: 'white' },
        dark: { primary: 'purpleLt', accent: 'gold', contrast: 'gold' },
      },
      fields: [
        defineField({
          name: 'light',
          title: 'Light Mode',
          type: 'object',
          fields: [
            { name: 'primary', type: 'string' },
            { name: 'accent', type: 'string' },
            { name: 'contrast', type: 'string' },
          ],
        }),
        defineField({
          name: 'dark',
          title: 'Dark Mode',
          type: 'object',
          fields: [
            { name: 'primary', type: 'string' },
            { name: 'accent', type: 'string' },
            { name: 'contrast', type: 'string' },
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
        { type: 'subscriptionSection' },
        { type: 'mapSection' },
        { type: 'linkSection' },
      ],
    }),
  ],
});
