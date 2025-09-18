import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

interface SendEmailOptions {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

const headerSanitizer = /[\r\n]+/g;

const sanitizeHeader = (value: string) => value.replace(headerSanitizer, ' ').trim();

const extractAngleEmail = (value: string) => {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim();
};

export function getImpersonationAddress(): string {
  const envValue = sanitizeHeader(String(process.env.EMAIL_IMPERSONATION_ADDRESS || ''));
  if (envValue) {
    return envValue;
  }
  const legacy = sanitizeHeader(String(process.env.FORM_FROM_EMAIL || ''));
  if (legacy) {
    console.warn(
      '[Email] EMAIL_IMPERSONATION_ADDRESS is not set; falling back to legacy FORM_FROM_EMAIL. Please update your configuration.',
    );
    return legacy;
  }
  throw new Error(
    'EMAIL_IMPERSONATION_ADDRESS is not set. Configure it with the Google Workspace user the service account should impersonate.',
  );
}

function loadCredentials(): { svcEmail: string; svcKey: string } {
  let svcEmail = '';
  let svcKeyRaw = '';

  const defaultKeyPath = path.join(process.cwd(), 'config', 'google-service-account.json');
  const keyFilePath = process.env.GMAIL_SERVICE_ACCOUNT_KEY_FILE || defaultKeyPath;
  if (fs.existsSync(keyFilePath)) {
    try {
      const creds = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
      if (typeof creds.client_email === 'string') {
        svcEmail = creds.client_email;
      }
      if (typeof creds.private_key === 'string') {
        svcKeyRaw = creds.private_key;
      }
    } catch (e) {
      throw new Error(`Failed to read Gmail service account file at ${keyFilePath}: ${(e as Error).message}`);
    }
  }

  if (!svcEmail) {
    svcEmail = process.env.GMAIL_SERVICE_ACCOUNT_EMAIL || '';
  }
  if (!svcKeyRaw) {
    const envRaw = process.env.GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY || '';
    if (envRaw.trim().startsWith('{')) {
      try {
        const creds = JSON.parse(envRaw);
        if (!svcEmail && typeof creds.client_email === 'string') {
          svcEmail = creds.client_email;
        }
        if (typeof creds.private_key === 'string') {
          svcKeyRaw = creds.private_key;
        }
      } catch {
        // ignore JSON parse errors
      }
    } else {
      svcKeyRaw = envRaw;
    }
  }

  if (!svcEmail || !svcKeyRaw) {
    throw new Error(
      'Missing Gmail service account credentials. Provide JSON at config/google-service-account.json (or set GMAIL_SERVICE_ACCOUNT_KEY_FILE), or set GMAIL_SERVICE_ACCOUNT_EMAIL and GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY (PEM or JSON).',
    );
  }

  const looksPlaceholder = /\.\.\.snip\.\.\.|<your[-\s_]?private[-\s_]?key>|REDACTED|PLACEHOLDER/i.test(svcKeyRaw);
  const hasPemHeader = /BEGIN [A-Z ]*PRIVATE KEY/.test(svcKeyRaw);
  if (looksPlaceholder || !hasPemHeader) {
    throw new Error(
      'Gmail service account private key appears invalid or placeholder. Place a valid credentials file at config/google-service-account.json (or set GMAIL_SERVICE_ACCOUNT_KEY_FILE), or provide GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY with a real PEM.',
    );
  }

  const svcKey = svcKeyRaw.includes('\\n') ? svcKeyRaw.replace(/\\n/g, '\n') : svcKeyRaw;
  return { svcEmail, svcKey };
}

export async function sendEmail({ to, from, subject, text, html, replyTo }: SendEmailOptions) {
  const { svcEmail, svcKey } = loadCredentials();

  const fromHeader = sanitizeHeader(from || getImpersonationAddress());
  const impersonationEmail = extractAngleEmail(fromHeader);
  if (!impersonationEmail) {
    throw new Error('Impersonation email is missing or invalid.');
  }

  const subjectHeader = sanitizeHeader(subject);

  const auth = new google.auth.JWT({
    email: svcEmail,
    key: svcKey,
    scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://mail.google.com/'],
    subject: impersonationEmail,
  } as any);
  await auth.authorize();

  const gmail = google.gmail({ version: 'v1', auth });

  if (!text && !html) {
    throw new Error('Email payload must include text or html content.');
  }

  const normalizeBody = (value: string) => value.replace(/\r?\n/g, '\n').replace(/\n/g, '\r\n');

  const headers = [
    `To: ${sanitizeHeader(to)}`,
    `Subject: ${subjectHeader}`,
    `From: ${fromHeader}`,
    'MIME-Version: 1.0',
  ];
  if (replyTo) {
    headers.push(`Reply-To: ${sanitizeHeader(replyTo)}`);
  }

  let message: string;
  if (html) {
    const boundary = `=_Part_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    const parts: string[] = [];
    const boundaryLine = `--${boundary}`;
    if (text) {
      parts.push(boundaryLine);
      parts.push('Content-Type: text/plain; charset="UTF-8"');
      parts.push('Content-Transfer-Encoding: 8bit');
      parts.push('');
      parts.push(normalizeBody(text));
    }
    parts.push(boundaryLine);
    parts.push('Content-Type: text/html; charset="UTF-8"');
    parts.push('Content-Transfer-Encoding: 8bit');
    parts.push('');
    parts.push(normalizeBody(html));
    parts.push(`${boundaryLine}--`);
    parts.push('');
    message = headers.join('\r\n') + '\r\n\r\n' + parts.join('\r\n');
  } else {
    headers.push('Content-Type: text/plain; charset="UTF-8"');
    headers.push('Content-Transfer-Encoding: 8bit');
    message = headers.join('\r\n') + '\r\n\r\n' + normalizeBody(text || '');
  }
  const raw = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
}

