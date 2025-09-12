import {Iframe} from 'sanity-plugin-iframe-pane';

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
      S.view
        .component(Iframe)
        .options({
          url: (doc: any) => {
            const slug = doc?.slug?.current;
            const rev = doc?._rev;
            if (slug) {
              const url = new URL('/api/preview', baseUrl);
              url.searchParams.set('slug', `/events/${slug}`);
              if (rev) url.searchParams.set('rev', rev);
              return url.toString();
            }
            return baseUrl;
          },
          reload: {button: true},
        })
        .title('Preview'),
    ]);
  }
  return S.document().views([S.view.form()]);
};
