# Event Preview in Sanity Studio

The studio renders event detail drafts directly without loading the Next.js site.

- The preview pane uses the Sanity client to fetch the current draft and listens for changes with `client.listen`.
- Updates appear instantly as you edit, and a light/dark toggle applies the document's color palette.
- The public website continues to query published content only, so drafts never affect the live site.
