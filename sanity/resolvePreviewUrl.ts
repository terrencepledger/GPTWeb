export function resolvePreviewUrl(doc: {_id: string; _type: string}) {
  const baseUrl = process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:3000';
  const params = new URLSearchParams();
  params.set('type', doc._type);
  params.set('id', doc._id.replace('drafts.', ''));
  return `${baseUrl}/api/preview?${params.toString()}`;
}
