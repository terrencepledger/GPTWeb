import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'calendarSection',
  title: 'Calendar Section',
  type: 'object',
  fields: [
    defineField({
      name: 'showSubscribe',
      title: 'Show Subscribe Button',
      type: 'boolean',
      initialValue: true,
    }),
  ],
});
