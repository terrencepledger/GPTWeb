// Minimal desk structure configuration
export const structure = (S: any) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('announcement').title('Announcements'),
      S.documentTypeListItem('event').title('Events'),
      S.documentTypeListItem('service').title('Services'),
      S.documentTypeListItem('ministry').title('Ministries'),
      S.documentTypeListItem('heroSlide').title('Hero Slides'),
      S.listItem()
        .title('Site Settings')
        .child(
          S.document().schemaType('siteSettings').documentId('siteSettings')
        ),
      S.documentTypeListItem('staff').title('Staff'),
      S.documentTypeListItem('missionStatement').title('Mission Statement'),
    ])
