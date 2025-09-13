import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'subscriptionSection',
  title: 'Subscription Section',
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
