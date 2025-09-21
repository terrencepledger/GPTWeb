// Minimal desk structure configuration
import MeetPastorPreviewPane from './components/MeetPastorPreviewPane'

export const structure = (S: any) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('announcement').title('Announcements'),
      S.documentTypeListItem('ministry').title('Ministries'),
      S.documentTypeListItem('heroSlide').title('Hero Slides'),
      S.documentTypeListItem('eventDetail').title('Event Details'),
      S.listItem()
        .title('Site Settings')
        .child(
          S.document().schemaType('siteSettings').documentId('siteSettings')
        ),
      S.listItem()
        .title('Chatbot Settings')
        .child(
          S.document().schemaType('chatbotSettings').documentId('chatbotSettings')
        ),
      S.documentTypeListItem('formSettings').title('Form Settings'),
      S.documentTypeListItem('staff').title('Staff'),
      S.listItem()
        .title('Meet the Pastor')
        .child(
          S.document()
            .title('Meet the Pastor')
            .schemaType('meetPastor')
            .documentId('meetPastor')
            .views([
              S.view.form(),
              S.view.component(MeetPastorPreviewPane).title('Preview'),
            ])
        ),
      S.documentTypeListItem('missionStatement').title('Mission Statement'),
    ])
