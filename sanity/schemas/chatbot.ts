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
  ],
});
