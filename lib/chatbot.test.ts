process.env.SANITY_STUDIO_PROJECT_ID = 'test';
process.env.SANITY_STUDIO_DATASET = 'test';

import assert from 'node:assert';
import { sanity } from './sanity';
import { generateChatbotReply } from './chatbot';

sanity.fetch = async () => '';

const fakeClient = {
  chat: {
    completions: {
      create: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                reply: 'Hello there',
                confidence: 0.9,
                similarityCount: 3,
                escalate: false,
                escalateReason: '',
              }),
            },
          },
        ],
      }),
    },
  },
};

(async () => {
  const { reply, confidence, similarityCount, escalate, escalateReason } = await generateChatbotReply(
    [
      {
        role: 'user',
        content: 'Hi',
        timestamp: new Date().toISOString(),
      },
    ],
    'friendly',
    fakeClient as any,
  );
  assert.strictEqual(reply, 'Hello there');
  assert.strictEqual(confidence, 0.9);
  assert.strictEqual(similarityCount, 3);
  assert.strictEqual(escalate, false);
  assert.strictEqual(escalateReason, '');
  console.log('tests passed');
})();

