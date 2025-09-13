// sanity.config.js
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {analyticsTool} from './sanity/plugins/analyticsTool'

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
import subscriptionSection from './sanity/schemas/sections/subscriptionSection'
import mapSection from './sanity/schemas/sections/mapSection'
import linkSection from './sanity/schemas/sections/linkSection'

// Desk structure
import {structure} from './sanity/deskStructure'
import {defaultDocumentNode} from './sanity/defaultDocumentNode'

// Safely read environment variables from Node and (optionally) Vite
const nodeEnv = (typeof process !== 'undefined' && process.env) ? process.env : {}
let viteEnv = {}
try {
    // @ts-ignore - import.meta may not exist when loaded by Node
    viteEnv = (import.meta && import.meta.env) || {}
} catch {}

const projectId = nodeEnv.SANITY_STUDIO_PROJECT_ID || nodeEnv.NEXT_PUBLIC_SANITY_PROJECT_ID || viteEnv.SANITY_STUDIO_PROJECT_ID
const dataset = nodeEnv.SANITY_STUDIO_DATASET || nodeEnv.NEXT_PUBLIC_SANITY_DATASET || viteEnv.SANITY_STUDIO_DATASET

export default defineConfig({
    name: 'default',
    title: 'GPTWeb Studio',
    projectId,
    dataset,
    schema: {
        types: [announcement, siteSettings, staff, ministry, heroSlide, missionStatement, eventDetail, heroSection, gallerySection, subscriptionSection, mapSection, linkSection],
    },
    plugins: [
        structureTool({
            structure,
            defaultDocumentNode,
        }),
        visionTool(),
        // Custom Analytics tool (embeds a GA/Looker Studio dashboard)
        // Configure URL via SANITY_STUDIO_GA_DASHBOARD_URL
        analyticsTool({
            url: (viteEnv && (viteEnv).SANITY_STUDIO_GA_DASHBOARD_URL) || nodeEnv.SANITY_STUDIO_GA_DASHBOARD_URL || nodeEnv.NEXT_PUBLIC_GA_DASHBOARD_URL,
        }),
    ],
    // Hide the Vision tool for non-admin users (e.g., editors)
    // currentUser is available in the context when using a function form of `tools`
    tools: (prev, context) => {
        const roles = context.currentUser?.roles?.map(r => r.name) || [];
        const isAdmin = roles.includes('administrator') || roles.includes('developer');
        return isAdmin ? prev : prev.filter(tool => tool.name !== 'vision');
    },
    vite: {
        define: {
            'process.env': {},
        },
    },
})
