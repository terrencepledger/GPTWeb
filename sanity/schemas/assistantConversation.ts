import {defineField, defineType} from 'sanity';

export default defineType({
  name: 'assistantConversation',
  title: 'Assistant Conversation',
  type: 'document',
  hidden: true,
  __experimental_actions: ['delete'],
  fields: [
    defineField({
      name: 'conversationId',
      title: 'Conversation ID',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'startedAt',
      title: 'Started At',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'lastInteractionAt',
      title: 'Last Interaction At',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires At',
      type: 'datetime',
      readOnly: true,
      description: 'Conversations are automatically purged after this time.',
    }),
    defineField({
      name: 'messageCount',
      title: 'Message Count',
      type: 'number',
      readOnly: true,
    }),
    defineField({
      name: 'lowestConfidence',
      title: 'Lowest Confidence',
      type: 'number',
      readOnly: true,
      description: 'Lowest assistant confidence score captured during the conversation (0-1).',
    }),
    defineField({
      name: 'softEscalateCount',
      title: 'Suggested Follow-ups',
      type: 'number',
      readOnly: true,
    }),
    defineField({
      name: 'escalated',
      title: 'Escalated',
      type: 'boolean',
      readOnly: true,
    }),
    defineField({
      name: 'escalationSummary',
      title: 'Escalation Summary',
      type: 'string',
      readOnly: true,
      description: 'Sanitized reason for any escalation request. Personal contact details are never stored.',
    }),
    defineField({
      name: 'faqCoverage',
      title: 'FAQ Coverage',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          {title: 'FAQ gap', value: 'gap'},
          {title: 'Covered', value: 'covered'},
          {title: 'Needs review', value: 'unknown'},
        ],
      },
    }),
    defineField({
      name: 'faqGapReasons',
      title: 'FAQ Gap Reasons',
      type: 'array',
      of: [{type: 'string'}],
      readOnly: true,
    }),
    defineField({
      name: 'resolutionState',
      title: 'Resolution State',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          {title: 'Escalated', value: 'escalated'},
          {title: 'Suggested follow-up', value: 'followUpSuggested'},
          {title: 'Visitor left', value: 'visitorAbandoned'},
          {title: 'Completed', value: 'completed'},
          {title: 'Unknown', value: 'unknown'},
        ],
      },
    }),
    defineField({
      name: 'contextKeys',
      title: 'Context Triggers',
      type: 'array',
      of: [{type: 'string'}],
      readOnly: true,
      description: 'Sources from the knowledge base that were included in the prompt for this conversation.',
    }),
    defineField({
      name: 'topicKeywords',
      title: 'Topic Keywords',
      type: 'array',
      of: [{type: 'string'}],
      readOnly: true,
    }),
    defineField({
      name: 'messages',
      title: 'Messages',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'message',
          fields: [
            defineField({
              name: 'role',
              title: 'Role',
              type: 'string',
              readOnly: true,
            }),
            defineField({
              name: 'content',
              title: 'Content',
              type: 'text',
              rows: 3,
              readOnly: true,
            }),
            defineField({
              name: 'timestamp',
              title: 'Timestamp',
              type: 'datetime',
              readOnly: true,
            }),
            defineField({
              name: 'confidence',
              title: 'Confidence',
              type: 'number',
              readOnly: true,
            }),
            defineField({
              name: 'softEscalate',
              title: 'Suggested Escalation',
              type: 'boolean',
              readOnly: true,
            }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'conversationId',
      subtitle: 'lastInteractionAt',
      media: 'escalated',
    },
    prepare({title, subtitle, media}) {
      const indicator = media ? '🚨' : '💬';
      return {
        title: title || 'Conversation',
        subtitle: subtitle ? new Date(subtitle).toLocaleString() : undefined,
        media: () => indicator,
      };
    },
  },
});
