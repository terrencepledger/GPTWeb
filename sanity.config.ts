import {defineConfig} from 'sanity';

// Import schema types
import announcement from './sanity/schemas/announcement';
import event from './sanity/schemas/event';
import sermon from './sanity/schemas/sermon';
import service from './sanity/schemas/service';
import siteSettings from './sanity/schemas/siteSettings';
import staff from './sanity/schemas/staff';

export default defineConfig({
  name: 'default',
  title: 'projectgptweb',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  schema: {
    types: [announcement, event, sermon, service, siteSettings, staff],
  },
});