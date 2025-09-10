import { defineField, defineType } from 'sanity';
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
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }],
    }),
  ],
});
