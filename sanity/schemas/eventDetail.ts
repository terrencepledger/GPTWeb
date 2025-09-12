import { defineField, defineType } from 'sanity';
import CalendarEventIdInput from '../components/CalendarEventIdInput';

const colorOptions = [
  { title: 'Purple', value: 'purple' },
  { title: 'Gold', value: 'gold' },
  { title: 'Ink', value: 'ink' },
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
        defineField({ name: 'primary', title: 'Primary', type: 'string', options: { list: colorOptions } }),
        defineField({ name: 'accent', title: 'Accent', type: 'string', options: { list: colorOptions } }),
        defineField({ name: 'contrast', title: 'Contrast', type: 'string', options: { list: colorOptions } }),
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
