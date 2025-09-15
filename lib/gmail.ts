import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

interface SendEmailOptions {
  to: string;
  from: string;
  subject: string;
  text: string;
  replyTo?: string;
}

function loadCredentials(): { svcEmail: string; svcKey: string } {
  let svcEmail = '';
  let svcKeyRaw = '';

  const defaultKeyPath = path.join(process.cwd(), 'config', 'gmail-service-account.json');
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
      'Missing Gmail service account credentials. Provide JSON at config/gmail-service-account.json (or set GMAIL_SERVICE_ACCOUNT_KEY_FILE), or set GMAIL_SERVICE_ACCOUNT_EMAIL and GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY (PEM or JSON).',
    );
  }

  const looksPlaceholder = /\.\.\.snip\.\.\.|<your[-\s_]?private[-\s_]?key>|REDACTED|PLACEHOLDER/i.test(svcKeyRaw);
  const hasPemHeader = /BEGIN [A-Z ]*PRIVATE KEY/.test(svcKeyRaw);
  if (looksPlaceholder || !hasPemHeader) {
    throw new Error(
      'Gmail service account private key appears invalid or placeholder. Place a valid credentials file at config/gmail-service-account.json (or set GMAIL_SERVICE_ACCOUNT_KEY_FILE), or provide GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY with a real PEM.',
    );
  }

  const svcKey = svcKeyRaw.includes('\\n') ? svcKeyRaw.replace(/\\n/g, '\n') : svcKeyRaw;
  return { svcEmail, svcKey };
}

export async function sendEmail({ to, from, subject, text, replyTo }: SendEmailOptions) {
  const { svcEmail, svcKey } = loadCredentials();

  const auth = new google.auth.JWT({
    email: svcEmail,
    key: svcKey,
    scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://mail.google.com/'],
    subject: from,
  } as any);
  await auth.authorize();

  const gmail = google.gmail({ version: 'v1', auth });

  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `From: ${from}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
  ];
  if (replyTo) {
    headers.push(`Reply-To: ${replyTo}`);
  }
  const message = headers.join('\r\n') + '\r\n\r\n' + text;
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

