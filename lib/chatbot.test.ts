process.env.SANITY_STUDIO_PROJECT_ID = 'test';
process.env.SANITY_STUDIO_DATASET = 'test';
const assert = require('node:assert');
const { sanity } = require('./sanity');
sanity.fetch = async () => '';
const { generateChatbotReply, shouldEscalate } = require('./chatbot');

const lowConfidence = [
  { role: 'user', content: 'Hi' },
  { role: 'assistant', content: 'Hmm', confidence: 0.4 },
];
assert.strictEqual(shouldEscalate(lowConfidence), true);

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
  const { reply, confidence } = await generateChatbotReply(
    [{ role: 'user', content: 'Hi' }],
    'friendly',
    fakeClient,
  );
  assert.strictEqual(reply, 'Hello there');
  assert.strictEqual(confidence, 0.9);
  console.log('tests passed');
})();
