import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'registrationSection',
  title: 'Registration Section',
  type: 'object',
  fields: [
    defineField({
      name: 'formUrl',
      title: 'Registration Form URL',
      type: 'url',
    }),
  ],
});
