import EventDetailPreview from './components/EventDetailPreview';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const defaultDocumentNode = (S: any, { schemaType }: { schemaType: string }) => {
  if (schemaType === 'eventDetail') {
    return S.document().views([
      S.view.form(),
      S.view.component(EventDetailPreview).title('Preview'),
    ]);
  }
  return S.document().views([S.view.form()]);
};
