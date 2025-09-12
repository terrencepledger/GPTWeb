import EventPreviewPane from './components/EventPreviewPane';

const baseUrl =
  import.meta.env.SANITY_STUDIO_SITE_URL ||
  import.meta.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000';

export const defaultDocumentNode = (
  S: any,
  {schemaType}: {schemaType: string}
) => {
  if (schemaType === 'eventDetail') {
    return S.document().views([
      S.view.form(),
      S.view.component(EventPreviewPane).title('Preview'),
    ]);
  }
  return S.document().views([S.view.form()]);
};
