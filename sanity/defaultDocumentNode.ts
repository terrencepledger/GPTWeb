import type {DefaultDocumentNodeResolver} from 'sanity/desk';
import Iframe from 'sanity-plugin-iframe-pane';
import {resolvePreviewUrl} from './resolvePreviewUrl';

const previewTypes = ['announcement', 'event', 'sermon', 'service', 'staff'];

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (previewTypes.includes(schemaType)) {
    return S.document().views([
      S.view.form(),
      S.view
        .component(Iframe)
        .options({
          url: (doc: any) => resolvePreviewUrl(doc),
          reload: {button: true},
        })
        .title('Preview'),
    ]);
  }

  return S.document();
};
