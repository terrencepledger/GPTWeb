// sanity.config.js
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import path from 'path'
import './sanity/sanity.css'

// Schemas
import announcement from './sanity/schemas/announcement'
import siteSettings from './sanity/schemas/siteSettings'
import staff from './sanity/schemas/staff'
import ministry from './sanity/schemas/ministry'
import heroSlide from './sanity/schemas/heroSlide'
import missionStatement from './sanity/schemas/missionStatement'
import eventDetail from './sanity/schemas/eventDetail'
import heroSection from './sanity/schemas/sections/heroSection'
import gallerySection from './sanity/schemas/sections/gallerySection'
import calendarSection from './sanity/schemas/sections/calendarSection'
import mapSection from './sanity/schemas/sections/mapSection'
import registrationSection from './sanity/schemas/sections/registrationSection'

// Desk structure
import {structure} from './sanity/deskStructure'
import {defaultDocumentNode} from './sanity/defaultDocumentNode'

export default defineConfig({
    name: 'default',
    title: 'GPTWeb Studio',
    projectId: import.meta.env.SANITY_STUDIO_PROJECT_ID,
    dataset: import.meta.env.SANITY_STUDIO_DATASET,
    schema: {
        types: [announcement, siteSettings, staff, ministry, heroSlide, missionStatement, eventDetail, heroSection, gallerySection, calendarSection, mapSection, registrationSection],
    },
    plugins: [
        structureTool({
            structure,
            defaultDocumentNode,
        }),
        visionTool(),
    ],
    // Hide the Vision tool for non-admin users (e.g., editors)
    // currentUser is available in the context when using a function form of `tools`
    tools: (prev, context) => {
        const roles = context.currentUser?.roles?.map(r => r.name) || [];
        const isAdmin = roles.includes('administrator') || roles.includes('developer');
        return isAdmin ? prev : prev.filter(tool => tool.name !== 'vision');
    },
    vite: {
        resolve: {
            alias: {
                'next/image': path.resolve(process.cwd(), 'sanity/components/NextImage.tsx'),
            },
        },
    },
})
