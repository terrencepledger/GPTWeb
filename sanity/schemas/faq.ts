import {defineField, defineType} from 'sanity';

export default defineType({
  name: 'faq',
  title: 'FAQ Entry',
  type: 'document',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'array',
      of: [{type: 'block'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Used to group questions on the FAQ page.',
    }),
    defineField({
      name: 'position',
      title: 'Sort Order',
      type: 'number',
      description: 'Lower numbers appear first on the FAQ page.',
    }),
    defineField({
      name: 'isTrending',
      title: 'Trending Highlight',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'assistantPrompt',
      title: 'Assistant Follow-up Prompt',
      type: 'text',
      rows: 3,
      description:
        'Optional prompt that will prefill the assistant when launched from this FAQ entry.',
    }),
  ],
  preview: {
    select: {
      title: 'question',
      subtitle: 'category',
    },
  },
  orderings: [
    {
      title: 'Sort Order',
      name: 'positionAsc',
      by: [
        {field: 'position', direction: 'asc'},
        {field: 'question', direction: 'asc'},
      ],
    },
  ],
});
