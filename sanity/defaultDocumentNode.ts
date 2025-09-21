import EventPreviewPane from './components/EventPreviewPane';
import MeetPastorPreviewPane from './components/MeetPastorPreviewPane';

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
  if (schemaType === 'meetPastor') {
    return S.document().views([
      S.view.form(),
      S.view.component(MeetPastorPreviewPane).title('Preview'),
    ]);
  }
  return S.document().views([S.view.form()]);
};
