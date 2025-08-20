// Minimal desk structure configuration
export const structure = (S: any) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('announcement').title('Announcements'),
      S.documentTypeListItem('event').title('Events'),
      S.documentTypeListItem('sermon').title('Sermons'),
      S.documentTypeListItem('service').title('Services'),
      S.documentTypeListItem('siteSettings').title('Site Settings'),
      S.documentTypeListItem('staff').title('Staff'),
    ])
