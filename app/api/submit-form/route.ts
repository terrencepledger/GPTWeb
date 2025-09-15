export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity';
import { sendEmail } from '@/lib/gmail';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slug, id, ...formData } = body || {};

    if (!slug && !id) {
      return NextResponse.json({ error: 'Missing page identifier' }, { status: 400 });
    }

    const params = slug ? { slug } : { id };
    const query = slug
      ? `*[_type == "formSettings" && slug.current == $slug][0]{ targetEmail }`
      : `*[_type == "formSettings" && _id == $id][0]{ targetEmail }`;

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
      subject: `New form submission from ${slug || id}`,
      text: JSON.stringify(formData, null, 2),
      replyTo,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Form submission error', err);
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
  }
}
