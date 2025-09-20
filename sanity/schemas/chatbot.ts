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
      rows: 6,
      description:
        "Optional additional background/context the assistant should consider for every conversation (e.g., corrections, policies, irregular hours).",
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
