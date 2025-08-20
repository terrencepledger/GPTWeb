import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';

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
  plugins: [structureTool()],
  tools: (prev, {currentUser}) =>
    currentUser?.roles.some(role => role.name === 'editor')
      ? prev.filter(tool => tool.name !== 'vision')
      : prev,
  schema: {
    types: [announcement, event, sermon, service, siteSettings, staff],
  },
});
