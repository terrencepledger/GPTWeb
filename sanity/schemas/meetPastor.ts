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
          name: 'tagline',
          title: 'Tagline',
          type: 'string',
          description: 'Short phrase to overlay on the hero image.',
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
      name: 'quickFacts',
      title: 'Quick Facts',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'fact',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string' }),
            defineField({ name: 'value', title: 'Value', type: 'string' }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'value' },
          },
        },
      ],
    }),
    defineField({
      name: 'highlightQuote',
      title: 'Highlight Quote',
      type: 'object',
      fields: [
        defineField({ name: 'text', title: 'Quote', type: 'text' }),
        defineField({ name: 'attribution', title: 'Attribution', type: 'string' }),
      ],
    }),
    defineField({
      name: 'biographySection',
      title: 'Biography & Ministry Journey',
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
      name: 'visionSection',
      title: 'Vision & Values',
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
          name: 'values',
          title: 'Values / Pillars',
          type: 'array',
          of: [{ type: 'string' }],
        }),
        defineField({
          name: 'quote',
          title: 'Quote',
          type: 'object',
          fields: [
            defineField({ name: 'text', title: 'Quote', type: 'text' }),
            defineField({ name: 'attribution', title: 'Attribution', type: 'string' }),
          ],
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
        defineField({
          name: 'highlights',
          title: 'Highlights',
          type: 'array',
          of: [{ type: 'string' }],
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
                  description: 'Optional tag such as Book, Sermon, Podcast.',
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
    defineField({
      name: 'connectSection',
      title: 'Call to Connect',
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
          name: 'cta',
          title: 'Primary CTA',
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string' }),
            defineField({ name: 'href', title: 'Link', type: 'url' }),
          ],
        }),
        defineField({
          name: 'contactMethods',
          title: 'Contact Methods',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'contactMethod',
              fields: [
                defineField({ name: 'label', title: 'Label', type: 'string' }),
                defineField({ name: 'value', title: 'Value', type: 'string' }),
                defineField({
                  name: 'href',
                  title: 'Link',
                  type: 'string',
                  description: 'Optional link such as mailto:, tel:, or a URL.',
                }),
              ],
              preview: {
                select: { title: 'label', subtitle: 'value' },
              },
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'timeline',
      title: 'Timeline',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'timelineEntry',
          fields: [
            defineField({ name: 'date', title: 'Date', type: 'string' }),
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'text' }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'date' },
          },
        },
      ],
    }),
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'testimonial',
          fields: [
            defineField({ name: 'quote', title: 'Quote', type: 'text' }),
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'role', title: 'Role', type: 'string' }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'role' },
          },
        },
      ],
    }),
  ],
});
