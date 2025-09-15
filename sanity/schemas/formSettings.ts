import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'formSettings',
  title: 'Form Settings',
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
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'targetEmail',
      title: 'Target Email',
      type: 'string',
      validation: (Rule) => Rule.email().required(),
    }),
  ],
});
