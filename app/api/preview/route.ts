import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || '/';
  const theme = searchParams.get('theme') || 'light';
  draftMode().enable();
  const res = NextResponse.redirect(slug);
  res.cookies.set('preview-theme', theme, { path: '/' });
  return res;
}
