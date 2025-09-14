import { defineType, defineField } from "sanity";

export default defineType({
  name: "chatbotSettings",
  title: "Chatbot Settings",
  type: "document",
  fields: [
    defineField({
      name: "tone",
      title: "Tone",
      type: "string",
      options: {
        list: [
          { title: "Formal", value: "formal" },
          { title: "Casual", value: "casual" },
          { title: "Friendly", value: "friendly" },
        ],
      },
    }),
    defineField({
      name: "extraContext",
      title: "Extra Context",
      type: "text",
      description: "Additional commands or context for the chatbot",
    }),
    defineField({
      name: "escalationFrom",
      title: "Escalation From (sender email)",
      type: "string",
      validation: (Rule) => Rule.email().warning("Should be a valid email address"),
      description: "The Google Workspace user the service account will impersonate when sending (e.g., support@yourdomain.com)",
    }),
    defineField({
      name: "escalationTo",
      title: "Escalation To (recipient email)",
      type: "string",
      validation: (Rule) => Rule.email().warning("Should be a valid email address"),
      description: "Destination mailbox for escalations",
    }),
  ],
});
