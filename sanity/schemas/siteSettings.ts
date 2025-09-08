import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
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
      name: 'youtubeChannelId',
      title: 'YouTube Channel ID',
      type: 'string',
    }),
    defineField({
      name: 'vimeoUserId',
      title: 'Vimeo User ID',
      type: 'string',
    }),
    defineField({
      name: 'vimeoAccessToken',
      title: 'Vimeo Access Token',
      type: 'string',
    }),
    defineField({
      name: 'googleProjectId',
      title: 'Google Cloud Project ID',
      type: 'string',
    }),
    defineField({
      name: 'googleServiceAccountEmail',
      title: 'Google Service Account Email',
      type: 'string',
    }),
    defineField({
      name: 'googleWorkloadIdentityProvider',
      title: 'Workload Identity Provider',
      type: 'string',
      description: 'Full resource name of the Workload Identity Provider',
    }),
    defineField({
      name: 'googleAdminEmail',
      title: 'Google Workspace Admin Email',
      type: 'string',
    }),
    defineField({
      name: 'googleNewsletterGroup',
      title: 'Newsletter Group Email',
      type: 'string',
    }),
    defineField({
      name: 'googleCalendarId',
      title: 'Default Calendar ID',
      type: 'string',
    }),
    defineField({
      name: 'googleMapsKey',
      title: 'Google Maps API Key',
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
  ],
});
