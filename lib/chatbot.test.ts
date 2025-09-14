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
              }),
            },
          },
        ],
      }),
    },
  },
};

(async () => {
  const { reply, confidence, similarityCount } = await generateChatbotReply(
    [{ role: 'user', content: 'Hi' }],
    'friendly',
    fakeClient as any,
  );
  assert.strictEqual(reply, 'Hello there');
  assert.strictEqual(confidence, 0.9);
  assert.strictEqual(similarityCount, 3);
  console.log('tests passed');
})();

