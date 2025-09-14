process.env.SANITY_STUDIO_PROJECT_ID = 'test';
process.env.SANITY_STUDIO_DATASET = 'test';
const assert = require('node:assert');
const { sanity } = require('./sanity');
sanity.fetch = async () => '';
const { generateChatbotReply, shouldEscalate } = require('./chatbot');

const repeated = [
  { role: 'user', content: 'When are services?' },
  { role: 'assistant', content: '...' },
  { role: 'user', content: 'What time are your services?' },
  { role: 'assistant', content: '...' },
  { role: 'user', content: 'When do services start?' },
];

const similarityClient = {
  chat: {
    completions: {
      create: async () => ({
        choices: [{ message: { content: JSON.stringify({ count: 2 }) } }],
      }),
    },
  },
};

const fakeClient = {
  chat: {
    completions: {
      create: async () => ({
        choices: [
          { message: { content: JSON.stringify({ reply: 'Hello there', confidence: 0.9 }) } },
        ],
      }),
    },
  },
};

(async () => {
  assert.strictEqual(
    await shouldEscalate(repeated, similarityClient),
    true,
  );
  const { reply, confidence } = await generateChatbotReply(
    [{ role: 'user', content: 'Hi' }],
    'friendly',
    fakeClient,
  );
  assert.strictEqual(reply, 'Hello there');
  assert.strictEqual(confidence, 0.9);
  console.log('tests passed');
})();
