import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'mapSection',
  title: 'Map Section',
  type: 'object',
  fields: [
    defineField({
      name: 'address',
      title: 'Address',
      type: 'string',
    }),
    defineField({
      name: 'mapType',
      title: 'Map Type',
      type: 'string',
      options: {
        list: [
          { title: 'Compact', value: 'compact' },
          { title: 'Full Width', value: 'full' },
        ],
        layout: 'radio',
      },
      initialValue: 'compact',
    }),
  ],
});
