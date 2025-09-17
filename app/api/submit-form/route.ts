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

    const lookups: {
      query: string;
      params: Record<string, string>;
      identifier: string;
    }[] = [];

    if (formId) {
      lookups.push({
        query: `*[_type == "formSettings" && (formId == $formId || _id == $formId)][0]{ targetEmail, "identifier": coalesce(formId, _id) }`,
        params: { formId },
        identifier: formId,
      });
    }

    if (pageId) {
      lookups.push({
        query: `*[_type == "formSettings" && page._ref == $pageId][0]{ targetEmail, "identifier": coalesce(formId, $pageId) }`,
        params: { pageId },
        identifier: pageId,
      });
    }

    let targetEmail: string | undefined;
    let identifierUsed: string | undefined;

    for (const lookup of lookups) {
      const result = await sanity.fetch<{
        targetEmail?: string;
        identifier?: string;
      }>(
        lookup.query,
        lookup.params,
      );

      if (result?.targetEmail) {
        targetEmail = result.targetEmail;
        identifierUsed = result.identifier ?? lookup.identifier;
        break;
      }
    }

    if (!targetEmail) {
      return NextResponse.json({ error: 'Form settings not found' }, { status: 404 });
    }

    const replyTo = typeof formData.email === 'string' ? formData.email : undefined;
    const from = process.env.FORM_FROM_EMAIL || targetEmail;
    await sendEmail({
      from,
      to: targetEmail,
      subject: `New form submission from ${identifierUsed ?? formId ?? pageId}`,
      text: JSON.stringify(formData, null, 2),
      replyTo,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Form submission error', err);
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
  }
}
