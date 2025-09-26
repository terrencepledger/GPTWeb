export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getImpersonationAddress, sendEmail } from "@/lib/gmail";

const headerSanitizer = /[\r\n]+/g;

const sanitizeHeader = (value: unknown) => String(value ?? "").replace(headerSanitizer, " ").trim();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const safeEmail = (value: unknown): string | null => {
  const sanitized = sanitizeHeader(value);
  return emailRegex.test(sanitized) ? sanitized : null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let submittedEmail: string | null = null;

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => null);
      if (body && typeof body.email === "string") {
        submittedEmail = body.email;
      }
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const emailField = formData.get("email");
      if (typeof emailField === "string") {
        submittedEmail = emailField;
      }
    } else {
      // Attempt to parse as JSON by default
      const body = await req.json().catch(() => null);
      if (body && typeof body.email === "string") {
        submittedEmail = body.email;
      }
    }

    const email = safeEmail(submittedEmail);
    if (!email) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const targetEmail = sanitizeHeader(process.env.NEWSLETTER_TARGET_EMAIL);
    if (!targetEmail) {
      console.error("NEWSLETTER_TARGET_EMAIL is not configured.");
      return NextResponse.json(
        { error: "Newsletter signups are not available right now. Please try again later." },
        { status: 500 },
      );
    }

    const impersonationAddress = getImpersonationAddress();
    const subject = sanitizeHeader(process.env.NEWSLETTER_FORWARD_SUBJECT ?? "New newsletter subscription");

    const submittedAt = new Date();
    const tz = process.env.TZ || "UTC";
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, dateStyle: "medium", timeStyle: "short" });
    const submittedAtText = formatter.format(submittedAt);

    const textBody = `Please add ${email} to the newsletter mailing list.\nRequested at ${submittedAtText} (${tz}).`;
    const htmlBody = `<div style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:14px;">` +
      `<p style="margin:0 0 12px 0;">Please add <strong>${escapeHtml(email)}</strong> to the newsletter mailing list.</p>` +
      `<p style="margin:0;">Requested at ${escapeHtml(submittedAtText)} (${escapeHtml(tz)}).</p>` +
      `</div>`;

    await sendEmail({
      from: impersonationAddress,
      to: targetEmail,
      subject,
      text: textBody,
      html: htmlBody,
      replyTo: email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter signup failed", error);
    return NextResponse.json(
      { error: "We couldn't complete your subscription right now. Please try again later." },
      { status: 500 },
    );
  }
}
