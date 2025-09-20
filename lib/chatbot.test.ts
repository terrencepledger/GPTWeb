process.env.SANITY_STUDIO_PROJECT_ID = 'test';
process.env.SANITY_STUDIO_DATASET = 'test';
process.env.TZ = 'UTC';

import assert from 'node:assert';
import { sanity } from './sanity';
import { buildSiteContext, generateChatbotReply } from './chatbot';

const sanityAny: any = sanity;
sanityAny.fetch = async () => '' as any;

const captured: { system?: string } = {};

const fakeClient = {
  chat: {
    completions: {
      create: async (payload: any) => {
        captured.system = payload?.messages?.[0]?.content;
        return {
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
        };
      },
    },
  },
};

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
    givingOptions: [
      { title: 'Online', content: 'Give', href: 'https://give.example.com' },
    ],
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
  assert.strictEqual(parsed.gv[0].u, 'https://give.example.com');
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
  assert.ok(captured.system?.includes('Site content JSON:'));
}

(async () => {
  await testBuildSiteContext();
  await testGenerateChatbotReply();
  console.log('tests passed');
})();

