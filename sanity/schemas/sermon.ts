import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'sermon',
  title: 'Sermon',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'speaker',
      title: 'Speaker',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'scripture',
      title: 'Scripture',
      type: 'string',
    }),
  ],
});
