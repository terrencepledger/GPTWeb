// sanity.config.js
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

// Schemas
import announcement from './sanity/schemas/announcement'
import event from './sanity/schemas/event'
import sermon from './sanity/schemas/sermon'
import service from './sanity/schemas/service'
import siteSettings from './sanity/schemas/siteSettings'
import staff from './sanity/schemas/staff'
import ministry from './sanity/schemas/ministry'

// Desk structure
import {structure} from './sanity/deskStructure'
import {defaultDocumentNode} from './sanity/defaultDocumentNode'

export default defineConfig({
    name: 'default',
    title: 'GPTWeb Studio',
    projectId: import.meta.env.SANITY_STUDIO_PROJECT_ID,
    dataset: import.meta.env.SANITY_STUDIO_DATASET,
    schema: {
        types: [announcement, event, sermon, service, siteSettings, staff, ministry],
    },
    plugins: [
        structureTool({
            structure,
            defaultDocumentNode,
        }),
        visionTool(),
    ],
})