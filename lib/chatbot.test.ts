process.env.SANITY_STUDIO_PROJECT_ID = 'test';
process.env.SANITY_STUDIO_DATASET = 'test';
process.env.TZ = 'UTC';

import assert from 'node:assert';
import { sanity } from './sanity';
import { buildSiteContext, generateChatbotReply } from './chatbot';

const sanityAny: any = sanity;
sanityAny.fetch = async () => '' as any;

const captured: { system?: string } = {};

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
  const match = repetitionMessage!.content.match(/Repetition analysis:\s*(\{.*})/);
  assert(match && match[1], 'Expected JSON payload in repetition analysis system message');
  return JSON.parse(match[1]);
}

async function testBuildSiteContext() {
  const ctxJson = await buildSiteContext({
    siteSettings: async () =>
      ({
        title: 'Test GPT',
        address: '123 Street',
        serviceTimes: 'Sun 10am',
        email: 'info@example.com',
        phone: '123-456-7890',
        socialLinks: [{ label: 'Facebook', href: 'https://fb.com/test' }],
        givingOptions: [
          {
            title: ' Online ',
            content: ' Give ',
            href: ' https://give.example.com/path)** ',
          },
          { title: 'Mail  ', content: ' 123  Main St \nSuite 2 ' },
        ],
      }) as any,
    announcementLatest: async () =>
      ({
        title: 'Latest',
        message: 'Details',
        cta: { label: 'Read more', href: 'https://example.com/latest' },
      }) as any,
    missionStatement: async () =>
      ({
        headline: 'Serve',
        tagline: 'Tag',
        message: 'Mission body',
      }) as any,
    staffAll: async () =>
      ([
        { name: 'Alice', role: 'Lead Pastor' },
        { name: 'Bob', role: 'Deacon' },
      ] as any),
    ministriesAll: async () =>
      ([
        { name: 'Youth', description: 'Teens' },
      ] as any),
    getCurrentLivestream: async () =>
      ({
        name: 'Sunday Service',
        link: 'https://example.com/live',
        live: { status: 'streaming' },
      }) as any,
    getUpcomingEvents: async () =>
      ([
        {
          title: 'Bible Study',
          start: '2024-05-02T18:30:00Z',
          location: 'Room 1',
          href: 'https://example.com/bible-study',
        },
      ] as any),
  });

  assert.ok(ctxJson);
  const parsed = JSON.parse(ctxJson);
  assert.strictEqual(parsed.st.t, 'Test GPT');
  assert.strictEqual(parsed.st.addr, '123 Street');
  assert.strictEqual(parsed.st.svc, 'Sun 10am');
  assert.strictEqual(parsed.st.email, 'info@example.com');
  assert.strictEqual(parsed.st.phone, '123-456-7890');
  assert.strictEqual(parsed.st.sl[0].u, 'https://fb.com/test');
  assert.strictEqual(parsed.ann.t, 'Latest');
  assert.strictEqual(parsed.ann.msg, 'Details');
  assert.strictEqual(parsed.ann.cta.u, 'https://example.com/latest');
  assert.strictEqual(parsed.ms.h, 'Serve');
  assert.strictEqual(parsed.ms.tg, 'Tag');
  assert.strictEqual(parsed.ms.msg, 'Mission body');
  assert.strictEqual(parsed.sf[0].n, 'Alice');
  assert.strictEqual(parsed.sf[0].r, 'Lead Pastor');
  assert.strictEqual(parsed.mn[0].n, 'Youth');
  assert.strictEqual(parsed.mn[0].d, 'Teens');
  assert.strictEqual(parsed.gv.length, 2);
  assert.strictEqual(parsed.gv[0].t, 'Online');
  assert.strictEqual(parsed.gv[0].c, 'Give');
  assert.strictEqual(parsed.gv[0].u, 'https://give.example.com/path');
  assert.strictEqual(parsed.gv[1].t, 'Mail');
  assert.strictEqual(parsed.gv[1].c, '123 Main St Suite 2');
  assert.strictEqual(parsed.gv[1].u, undefined);
  assert.strictEqual(parsed.ls.st, 'live');
  assert.strictEqual(parsed.ls.u, 'https://example.com/live');
  assert.strictEqual(parsed.ev[0].t, 'Bible Study');
  assert.ok(parsed.ev[0].dt);
  assert.strictEqual(parsed.ev[0].loc, 'Room 1');
  assert.strictEqual(parsed.ev[0].u, 'https://example.com/bible-study');
  assert.ok(Array.isArray(parsed.nav));
  assert.ok(parsed.nav.length > 0);
}

async function testGenerateChatbotReply() {
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
    assert.ok(captured.system?.includes('Site content JSON:'));
}

(async () => {
    await testBuildSiteContext();
    await testGenerateChatbotReply();
    console.log('tests passed');
})()
