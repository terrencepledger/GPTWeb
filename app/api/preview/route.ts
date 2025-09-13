import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || '/';
  const theme = searchParams.get('theme') || 'light';
  const rev = searchParams.get('rev');
  const url = new URL(slug, new URL(req.url).origin);
  if (rev) url.searchParams.set('rev', rev);
  // Also pass theme via query param so pages can react immediately even if cookies are blocked
  if (theme) url.searchParams.set('theme', theme);
  // Preserve draft=1 flag so the page can request draft content without enabling global preview cookies
  url.searchParams.set('draft', '1');
  const res = NextResponse.redirect(url);
  res.cookies.set('preview-theme', theme, { path: '/' });
  return res;
}
