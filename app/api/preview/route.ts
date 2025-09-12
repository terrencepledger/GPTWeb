import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || '/';
  const theme = searchParams.get('theme') || 'light';
  const rev = searchParams.get('rev');
  draftMode().enable();
  const url = new URL(slug, new URL(req.url).origin);
  if (rev) url.searchParams.set('rev', rev);
  const res = NextResponse.redirect(url);
  res.cookies.set('preview-theme', theme, { path: '/' });
  return res;
}
