import {defineConfig} from 'sanity';
import {deskTool} from 'sanity/desk';
import {visionTool} from '@sanity/vision';
import {schemaTypes} from './sanity/schema';
import {structure} from './sanity/deskStructure';
import {defaultDocumentNode} from './sanity/defaultDocumentNode';

export default defineConfig({
  name: 'default',
  title: 'GPTWeb Studio',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [deskTool({structure, defaultDocumentNode}), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
