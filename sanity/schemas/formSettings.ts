import { defineField, defineType } from 'sanity';

const workspaceDomain =
  process.env.SANITY_STUDIO_WORKSPACE_DOMAIN ||
  process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN;

export default defineType({
  name: 'formSettings',
  title: 'Form Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'page',
      title: 'Page',
      type: 'reference',
      to: [{ type: 'page' }],
      options: {
        disableNew: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'targetEmail',
      title: 'Target Email',
      type: 'string',
      validation: (Rule) =>
        Rule.required()
          .email()
          .custom((email) => {
            if (!workspaceDomain) return true;
            return email?.endsWith(`@${workspaceDomain}`)
              ? true
              : `Must be an @${workspaceDomain} email`;
          }),
    }),
  ],
  preview: {
    select: {
      title: 'page.title',
    },
  },
});
