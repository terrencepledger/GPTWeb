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
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
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
    defineField({
      name: 'givingOptions',
      title: 'Giving Options',
      description: 'Giving methods surfaced in the chatbot and on the giving page.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'givingOption',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'content',
              title: 'Content',
              type: 'string',
              validation: (Rule) => Rule.required(),
              description: 'Shown as the detail such as an address or username.',
            },
            {
              name: 'href',
              title: 'Link',
              type: 'url',
              validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'planVisit',
      title: 'Plan a Visit',
      type: 'object',
      fields: [
        defineField({
          name: 'leadPastor',
          title: 'Featured Pastor',
          type: 'reference',
          to: [{ type: 'staff' }],
          description: 'Select the pastor visitors will meet when they arrive.',
        }),
        defineField({
          name: 'pastorMessage',
          title: 'Pastor Welcome Message',
          type: 'text',
          rows: 3,
        }),
        defineField({
          name: 'churchImage',
          title: 'Church Photo',
          type: 'image',
          options: { hotspot: true },
        }),
        defineField({
          name: 'youthMinistry',
          title: 'Youth Ministry Highlight',
          type: 'reference',
          to: [{ type: 'ministry' }],
          description: 'Choose the ministry to highlight for youth visitors.',
        }),
        defineField({
          name: 'youthInvite',
          title: 'Youth Invite Message',
          type: 'text',
          rows: 3,
        }),
      ],
    }),
  ],
});
