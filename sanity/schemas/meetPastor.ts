import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'meetPastor',
  title: 'Meet the Pastor',
  type: 'document',
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'subtitle',
          title: 'Subtitle',
          type: 'string',
        }),
        defineField({
          name: 'image',
          title: 'Image',
          type: 'image',
          options: { hotspot: true },
        }),
        defineField({
          name: 'imageAlt',
          title: 'Image Alt Text',
          type: 'string',
          description: 'Accessible description for the hero image.',
        }),
      ],
    }),
    defineField({
      name: 'biographySection',
      title: 'Bio & Journey',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({
          name: 'body',
          title: 'Body',
          type: 'array',
          of: [{ type: 'block' }],
        }),
        defineField({
          name: 'image',
          title: 'Image',
          type: 'image',
          options: { hotspot: true },
        }),
        defineField({
          name: 'imageAlt',
          title: 'Image Alt Text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'personalSection',
      title: 'Personal & Family',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({
          name: 'body',
          title: 'Body',
          type: 'array',
          of: [{ type: 'block' }],
        }),
        defineField({
          name: 'image',
          title: 'Image',
          type: 'image',
          options: { hotspot: true },
        }),
        defineField({
          name: 'imageAlt',
          title: 'Image Alt Text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'mediaSection',
      title: 'Media & Resources',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({
          name: 'intro',
          title: 'Intro',
          type: 'array',
          of: [{ type: 'block' }],
        }),
        defineField({
          name: 'items',
          title: 'Items',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'mediaItem',
              fields: [
                defineField({ name: 'title', title: 'Title', type: 'string' }),
                defineField({ name: 'description', title: 'Description', type: 'text' }),
                defineField({
                  name: 'label',
                  title: 'Label',
                  type: 'string',
                  description: 'Optional tag such as Book, Sermon, or Podcast.',
                }),
                defineField({
                  name: 'url',
                  title: 'URL',
                  type: 'url',
                  validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
                }),
              ],
              preview: {
                select: { title: 'title', subtitle: 'label' },
              },
            },
          ],
        }),
      ],
    }),
  ],
});
