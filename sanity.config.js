// sanity.config.js
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {analyticsTool} from './sanity/plugins/analyticsTool'
import {assistantConversationsTool} from './sanity/plugins/assistantConversationsTool'
import {calendarSyncTool} from './sanity/plugins/calendarSyncTool'

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
import chatbot from './sanity/schemas/chatbot'
import assistantConversation from './sanity/schemas/assistantConversation'
import calendarSyncMapping from './sanity/schemas/calendarSyncMapping'
import formSettings from './sanity/schemas/formSettings'
import page from './sanity/schemas/page'
import faq from './sanity/schemas/faq'

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

function pickFirstString(values) {
    for (const value of values) {
        if (typeof value === 'string') {
            const trimmed = value.trim()
            if (trimmed) {
                return trimmed
            }
        }
    }
    return undefined
}

function stripTrailingSlash(value) {
    return value.replace(/\/$/, '')
}

function withCalendarPath(value) {
    if (!value) return undefined
    const normalized = stripTrailingSlash(value)
    return /\/calendar$/i.test(normalized) ? normalized : `${normalized}/api/calendar`
}

const siteOrigin = pickFirstString([
    (viteEnv && (viteEnv).SANITY_STUDIO_SITE_ORIGIN),
    (viteEnv && (viteEnv).NEXT_PUBLIC_SITE_ORIGIN),
    nodeEnv.SANITY_STUDIO_SITE_ORIGIN,
    nodeEnv.NEXT_PUBLIC_SITE_ORIGIN,
    nodeEnv.NEXT_PUBLIC_SITE_BASE_URL,
    nodeEnv.VERCEL_URL ? `https://${stripTrailingSlash(nodeEnv.VERCEL_URL)}` : undefined,
]) || 'http://localhost:3000'

const explicitCalendarBase = pickFirstString([
    (viteEnv && (viteEnv).SANITY_STUDIO_CALENDAR_API_BASE),
    nodeEnv.SANITY_STUDIO_CALENDAR_API_BASE,
    nodeEnv.NEXT_PUBLIC_CALENDAR_API_BASE,
])

const calendarApiBaseEnv = explicitCalendarBase
    ? stripTrailingSlash(explicitCalendarBase)
    : withCalendarPath(siteOrigin)

export default defineConfig({
    name: 'default',
    title: 'GPTWeb Studio',
    projectId,
    dataset,
    schema: {
        types: [announcement, siteSettings, staff, ministry, heroSlide, missionStatement, eventDetail, heroSection, gallerySection, subscriptionSection, mapSection, linkSection, chatbot, assistantConversation, calendarSyncMapping, formSettings, faq, page],
    },
    plugins: [
        structureTool({
            structure,
            defaultDocumentNode,
        }),
        // Custom Analytics tool (embeds a GA/Looker Studio dashboard)
        // Configure URL via SANITY_STUDIO_GA_DASHBOARD_URL
        analyticsTool({
            url: (viteEnv && (viteEnv).SANITY_STUDIO_GA_DASHBOARD_URL) || nodeEnv.SANITY_STUDIO_GA_DASHBOARD_URL || nodeEnv.NEXT_PUBLIC_GA_DASHBOARD_URL,
        }),
        assistantConversationsTool(),
        calendarSyncTool({
            apiBaseUrl: calendarApiBaseEnv,
            internalColor: 'color-mix(in oklab, var(--brand-border) 70%, var(--brand-surface) 30%)',
            publicColor: 'var(--brand-accent)',
        }),
    ],
    vite: {
        define: {
            'process.env': {},
        },
    },
})
