process.env.SANITY_STUDIO_PROJECT_ID = 'test';
process.env.SANITY_STUDIO_DATASET = 'test';

import assert from 'node:assert';
import { sanity } from './sanity';
import { generateChatbotReply } from './chatbot';

const sanityAny: any = sanity;
sanityAny.fetch = async () => '' as any;

const calls: any[] = [];
let callIndex = 0;

const responses = [
  {
    reply: 'Hello there',
    confidence: 0.9,
    similarityCount: 0,
    escalate: false,
    escalateReason: '',
  },
  {
    reply: 'Sure thing',
    confidence: 0.6,
    similarityCount: 0,
    escalate: false,
    escalateReason: '',
  },
  {
    reply: 'Connecting you now',
    confidence: 0.5,
    similarityCount: 0,
    escalate: true,
    escalateReason: 'Visitor asked for a person.',
  },
];

const fakeClient = {
  chat: {
    completions: {
      create: async (input: any) => {
        calls.push(input);
        const response = responses[Math.min(callIndex, responses.length - 1)];
        callIndex += 1;
        return {
          choices: [
            {
              message: {
                content: JSON.stringify(response),
              },
            },
          ],
        };
      },
    },
  },
};

function parseRepetition(call: any) {
  const repetitionMessage = call.messages.find(
    (msg: any) =>
      msg.role === 'system' &&
      typeof msg.content === 'string' &&
      msg.content.startsWith('Repetition analysis:'),
  );
  assert(repetitionMessage, 'Expected repetition analysis system message');
  const match = repetitionMessage!.content.match(/Repetition analysis:\s*(\{.*\})/);
  assert(match && match[1], 'Expected JSON payload in repetition analysis system message');
  return JSON.parse(match[1]);
}

(async () => {
  const base = Date.now();

  const firstResult = await generateChatbotReply(
    [
      {
        role: 'user',
        content: 'Hello, what time is service?',
        timestamp: new Date(base).toISOString(),
      },
    ],
    'friendly',
    fakeClient as any,
  );

  assert.strictEqual(firstResult.reply, 'Hello there');
  assert.strictEqual(firstResult.confidence, 0.9);
  assert.strictEqual(firstResult.similarityCount, 1);
  assert.strictEqual(firstResult.escalate, false);
  assert.strictEqual(firstResult.escalateReason, '');
  const firstAnalysis = parseRepetition(calls[0]);
  assert.strictEqual(firstAnalysis.similarityCount, 1);
  assert.strictEqual(firstAnalysis.autoEscalate, false);

  const repeatedMessages = [
    {
      role: 'user',
      content: 'What time is service on Sunday?',
      timestamp: new Date(base + 1).toISOString(),
    },
    {
      role: 'assistant',
      content: 'Services begin at 10:00 AM.',
      timestamp: new Date(base + 2).toISOString(),
    },
    {
      role: 'user',
      content: 'Can you remind me what time the Sunday service starts?',
      timestamp: new Date(base + 3).toISOString(),
    },
    {
      role: 'assistant',
      content: 'It starts at 10:00 AM each Sunday.',
      timestamp: new Date(base + 4).toISOString(),
    },
    {
      role: 'user',
      content: 'Sorry, what time is the Sunday service again?',
      timestamp: new Date(base + 5).toISOString(),
    },
  ];

  const repeatedResult = await generateChatbotReply(
    repeatedMessages,
    'friendly',
    fakeClient as any,
  );

  assert.strictEqual(repeatedResult.reply, 'Sure thing');
  assert.strictEqual(repeatedResult.confidence, 0.6);
  assert.strictEqual(repeatedResult.similarityCount, 3);
  assert.strictEqual(repeatedResult.escalate, true);
  assert.strictEqual(repeatedResult.escalateReason, 'User repeated the question multiple times.');
  const secondAnalysis = parseRepetition(calls[1]);
  assert.strictEqual(secondAnalysis.similarityCount, 3);
  assert.strictEqual(secondAnalysis.autoEscalate, true);

  const manualResult = await generateChatbotReply(
    [
      {
        role: 'user',
        content: 'Please connect me with a staff member.',
        timestamp: new Date(base + 6).toISOString(),
      },
    ],
    'friendly',
    fakeClient as any,
  );

  assert.strictEqual(manualResult.reply, 'Connecting you now');
  assert.strictEqual(manualResult.confidence, 0.5);
  assert.strictEqual(manualResult.similarityCount, 1);
  assert.strictEqual(manualResult.escalate, true);
  assert.strictEqual(manualResult.escalateReason, 'Visitor asked for a person.');

  console.log('tests passed');
})();
