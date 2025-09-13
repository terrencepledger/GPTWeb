import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'linkSection',
  title: 'Link Section',
  type: 'object',
  fields: [
    defineField({
      name: 'linkText',
      title: 'Link Text',
      type: 'string',
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
    }),
  ],
});
