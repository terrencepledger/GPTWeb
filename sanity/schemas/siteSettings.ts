import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true }
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'string',
    }),
    defineField({
      name: 'serviceTimes',
      title: 'Service Times',
      type: 'string',
      description: 'e.g., Sundays 9am & 11am; Wednesdays 7pm',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'socialLink',
          fields: [
            { name: 'label', title: 'Label', type: 'string' },
            {
              name: 'href',
              title: 'URL',
              type: 'url',
              validation: (Rule) =>
                Rule.uri({ scheme: ['http', 'https', 'mailto', 'tel', 'sms'] }),
            },
            { name: 'description', title: 'Description', type: 'string' },
            {
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {
                list: [
                  { title: 'Facebook', value: 'facebook' },
                  { title: 'Instagram', value: 'instagram' },
                  { title: 'TikTok', value: 'tiktok' },
                  { title: 'SMS', value: 'sms' },
                  { title: 'YouTube', value: 'youtube' },
                ],
              },
            },
          ],
        },
      ],
    }),
  ],
});
