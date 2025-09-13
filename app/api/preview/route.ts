import { NextResponse } from 'next/server';
import { cookies, draftMode } from 'next/headers';

// /api/preview?secret=...&redirect=/events/slug&theme=light|dark
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret') || '';
    const expected = process.env.SANITY_PREVIEW_SECRET || process.env.NEXT_PREVIEW_SECRET || '';
    const redirectTo = searchParams.get('redirect') || '/';
    const theme = searchParams.get('theme');

    // If a secret is configured, require it to match.
    if (expected && secret !== expected) {
      return new NextResponse('Invalid preview secret', { status: 401 });
    }

    // Enable Next.js draft mode cookies.
    draftMode().enable();

    // Optional: store a theme hint for embedded previews.
    if (theme === 'light' || theme === 'dark') {
      cookies().set('preview-theme', theme, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
      });
    }

    // Redirect back to the provided path to see preview content.
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (err) {
    return new NextResponse('Failed to enable preview', { status: 500 });
  }
}
