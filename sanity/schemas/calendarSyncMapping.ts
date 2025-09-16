import {defineField, defineType} from 'sanity';

const STATUS_OPTIONS = [
  {title: 'Draft', value: 'draft'},
  {title: 'Published', value: 'published'},
  {title: 'Unpublished', value: 'unpublished'},
];

export default defineType({
  name: 'calendarSyncMapping',
  title: 'Calendar Sync Mapping',
  type: 'document',
  liveEdit: true,
  hidden: true,
  fields: [
    defineField({
      name: 'sourceEventId',
      title: 'Internal Event ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publicEventId',
      title: 'Public Event ID',
      type: 'string',
    }),
    defineField({
      name: 'lastPublicEventId',
      title: 'Last Public Event ID',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {list: STATUS_OPTIONS, layout: 'radio'},
      initialValue: 'draft',
      readOnly: true,
    }),
    defineField({
      name: 'payloadHash',
      title: 'Payload Hash',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'lastSyncedAt',
      title: 'Last Synced At',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'sourceEventId',
      subtitle: 'publicEventId',
      status: 'status',
    },
    prepare({title, subtitle, status}) {
      return {
        title: title || 'Unmapped Event',
        subtitle: [status, subtitle].filter(Boolean).join(' • ') || undefined,
      };
    },
  },
});
