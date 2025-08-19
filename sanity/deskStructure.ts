import type {StructureResolver} from 'sanity/desk';

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('announcement').title('Announcements'),
      S.documentTypeListItem('event').title('Events'),
      S.documentTypeListItem('sermon').title('Sermons'),
      S.documentTypeListItem('service').title('Services'),
      S.documentTypeListItem('staff').title('Staff'),
      S.listItem()
        .title('Site Settings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
        ),
    ]);
