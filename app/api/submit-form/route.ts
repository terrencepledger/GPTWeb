export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity';
import { getImpersonationAddress, sendEmail } from '@/lib/gmail';

const headerSanitizer = /[\r\n]+/g;

const sanitizeHeader = (value: unknown) => String(value ?? '').replace(headerSanitizer, ' ').trim();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const safeEmail = (value: unknown): string | null => {
  const sanitized = sanitizeHeader(value);
  return emailRegex.test(sanitized) ? sanitized : null;
};

const formatLabel = (key: string) => {
  const normalized = key.replace(/[_-]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => formatValue(item)).filter((item) => item).join(', ');
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slug, id, ...formData } = body || {};

    if (!slug && !id) {
      return NextResponse.json({ error: 'Missing page identifier' }, { status: 400 });
    }

    const params = slug ? { slug } : { id };
    const query = slug
      ? `*[_type == "formSettings" && slug.current == $slug][0]{ targetEmail, title }`
      : `*[_type == "formSettings" && _id == $id][0]{ targetEmail, title }`;

    const result = await sanity.fetch<{ targetEmail?: string; title?: string }>(query, params);
    const targetEmail = sanitizeHeader(result?.targetEmail);
    const title = sanitizeHeader(result?.title);

    if (!targetEmail) {
      return NextResponse.json({ error: 'Form settings not found' }, { status: 404 });
    }

    const impersonationAddress = getImpersonationAddress();
    const replyTo = safeEmail(formData.email);
    const submittedAt = new Date();
    const tz = process.env.TZ || 'UTC';
    const timestampFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const submittedAtText = timestampFormatter.format(submittedAt);

    const entryLines = Object.entries(formData)
      .map(([key, value]) => {
        const formatted = formatValue(value);
        if (!formatted) return null;
        return `${formatLabel(key)}: ${formatted}`;
      })
      .filter((line): line is string => Boolean(line));
    const entryBlockText = entryLines.join('\n');
    const entryBlockHtml = entryLines.length
      ? `<pre style="font-family:'Courier New',monospace;background-color:rgb(238,238,238);padding:8px;">${escapeHtml(entryBlockText)}</pre>`
      : '';

    const subjectTitle = sanitizeHeader(
      title || (typeof slug === 'string' ? slug : typeof id === 'string' ? id : 'form'),
    );
    const submitterName = sanitizeHeader(formData.name || replyTo || 'Visitor');
    const staffSubject = sanitizeHeader(`New ${subjectTitle} submission from ${submitterName}`);

    const staffLines: string[] = [
      `Form: ${subjectTitle}`,
      `Submitted At: ${submittedAtText}`,
    ];
    if (slug) {
      staffLines.push(`Form Slug: ${sanitizeHeader(slug)}`);
    } else if (id) {
      staffLines.push(`Form ID: ${sanitizeHeader(id)}`);
    }
    if (entryLines.length) {
      staffLines.push('');
      staffLines.push(...entryLines);
    }
    const staffBody = staffLines.join('\n');

    await sendEmail({
      from: impersonationAddress,
      to: targetEmail,
      subject: staffSubject,
      text: staffBody,
      replyTo: replyTo || undefined,
    });

    if (replyTo) {
      const ackName = sanitizeHeader(formData.name || 'there');
      const ackSubject = sanitizeHeader(`We received your ${subjectTitle} submission`);
      const ackLines: string[] = [
        `Hi ${ackName},`,
        '',
        `Thanks for reaching out! We've received your ${subjectTitle} submission on ${submittedAtText}.`,
      ];
      if (entryLines.length) {
        ackLines.push('');
        ackLines.push('Here is a copy of what you sent:');
        ackLines.push('');
        ackLines.push(...entryLines);
      }
      ackLines.push('');
      ackLines.push('We will get back to you soon.');
      const ackBody = ackLines.join('\n');

      const ackHtmlParts: string[] = [
        `<p style="margin:0 0 16px 0;">Hi ${escapeHtml(ackName)},</p>`,
        `<p style="margin:0 0 16px 0;">Thanks for reaching out! We've received your ${escapeHtml(
          subjectTitle,
        )} submission on ${escapeHtml(submittedAtText)}.</p>`,
      ];
      if (entryBlockHtml) {
        ackHtmlParts.push('<p style="margin:0 0 12px 0;">Here is a copy of what you sent:</p>');
        ackHtmlParts.push(entryBlockHtml);
      }
      ackHtmlParts.push('<p style="margin:16px 0 0 0;">We will get back to you soon.</p>');
      const ackHtmlContainerStart =
        `<div style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:14px;">`;
      const ackHtml = `${ackHtmlContainerStart}${ackHtmlParts.join('')}</div>`;

      try {
        await sendEmail({
          from: impersonationAddress,
          to: replyTo,
          subject: ackSubject,
          text: ackBody,
          html: ackHtml,
          replyTo: targetEmail,
        });
      } catch (copyError) {
        console.warn('Failed to send confirmation copy to submitter', copyError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Form submission error', err);
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
  }
}
