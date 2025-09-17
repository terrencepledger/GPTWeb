export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity';
import { sendEmail } from '@/lib/gmail';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pageId: rawPageId, formId: rawFormId, ...formData } = body || {};
    const pageId = typeof rawPageId === 'string' ? rawPageId : undefined;
    const formId = typeof rawFormId === 'string' ? rawFormId : undefined;

    if (!pageId && !formId) {
      return NextResponse.json({ error: 'Missing page identifier' }, { status: 400 });
    }

    const query = pageId
      ? `*[_type == "formSettings" && page._ref == $pageId][0]{ targetEmail }`
      : `*[_type == "formSettings" && _id == $formId][0]{ targetEmail }`;
    const params = pageId ? { pageId } : { formId: formId as string };

    const result = await sanity.fetch<{ targetEmail?: string }>(query, params);
    const targetEmail = result?.targetEmail;

    if (!targetEmail) {
      return NextResponse.json({ error: 'Form settings not found' }, { status: 404 });
    }

    const replyTo = typeof formData.email === 'string' ? formData.email : undefined;
    const from = process.env.FORM_FROM_EMAIL || targetEmail;
    await sendEmail({
      from,
      to: targetEmail,
      subject: `New form submission from ${pageId || formId}`,
      text: JSON.stringify(formData, null, 2),
      replyTo,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Form submission error', err);
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
  }
}
