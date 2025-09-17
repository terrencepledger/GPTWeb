// sanity.config.js
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {analyticsTool} from './sanity/plugins/analyticsTool'
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
import calendarSyncMapping from './sanity/schemas/calendarSyncMapping'

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

const MEDIA_GROUP_EMAIL = 'media@gptchurch.org'

const groupCandidateKeys = ['email', 'groupEmail', 'group', 'value', 'id', 'name']
const groupNestedKeys = ['groups', 'memberships', 'items', 'values', 'entries']

function extractGroupEmails(input, target, seen) {
    if (!input) return
    if (typeof input === 'string') {
        const normalized = input.trim().toLowerCase()
        if (normalized && normalized.includes('@')) {
            target.add(normalized)
        }
        return
    }
    if (Array.isArray(input)) {
        input.forEach(item => extractGroupEmails(item, target, seen))
        return
    }
    if (input instanceof Set) {
        input.forEach(item => extractGroupEmails(item, target, seen))
        return
    }
    if (input instanceof Map) {
        input.forEach((value, key) => {
            extractGroupEmails(key, target, seen)
            extractGroupEmails(value, target, seen)
        })
        return
    }
    if (typeof input === 'object') {
        if (!seen) {
            seen = new WeakSet()
        }
        if (seen.has(input)) {
            return
        }
        seen.add(input)
        groupCandidateKeys.forEach(key => {
            if (key in input) {
                extractGroupEmails(input[key], target, seen)
            }
        })
        groupNestedKeys.forEach(key => {
            if (key in input) {
                extractGroupEmails(input[key], target, seen)
            }
        })
    }
}

function getWorkspaceGroups(user) {
    const groups = new Set()
    if (!user) return groups
    const seen = new WeakSet()
    extractGroupEmails(user.groups, groups, seen)
    extractGroupEmails(user.identity && user.identity.groups, groups, seen)
    extractGroupEmails(user.provider && user.provider.groups, groups, seen)
    extractGroupEmails(user.profile && user.profile.groups, groups, seen)
    extractGroupEmails(user.memberships, groups, seen)
    extractGroupEmails(user.externalGroups, groups, seen)
    extractGroupEmails(user.providerIdentities, groups, seen)
    extractGroupEmails(user.ssoGroups, groups, seen)
    return groups
}

async function fetchWorkspaceGroupsFromApi(client) {
    const groups = new Set()
    if (!client) return groups
    try {
        const response = await client.request({uri: '/users/me/groups'})
        extractGroupEmails(response, groups, new WeakSet())
    } catch (error) {
        console.warn('Failed to load workspace groups from API', error)
    }
    return groups
}

const calendarApiBaseEnv =
    (viteEnv && (viteEnv).SANITY_STUDIO_CALENDAR_API_BASE) ||
    nodeEnv.SANITY_STUDIO_CALENDAR_API_BASE ||
    nodeEnv.NEXT_PUBLIC_CALENDAR_API_BASE ||
    undefined

export default defineConfig({
    name: 'default',
    title: 'GPTWeb Studio',
    projectId,
    dataset,
    schema: {
        types: [announcement, siteSettings, staff, ministry, heroSlide, missionStatement, eventDetail, heroSection, gallerySection, subscriptionSection, mapSection, linkSection, chatbot, calendarSyncMapping],
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
        calendarSyncTool({
            apiBaseUrl: calendarApiBaseEnv,
            internalColor: 'color-mix(in oklab, var(--brand-border) 70%, var(--brand-surface) 30%)',
            publicColor: 'var(--brand-accent)',
        }),
    ],
    // Hide the Vision tool for non-admin users (e.g., editors)
    // currentUser is available in the context when using a function form of `tools`
    tools: async (prev, context) => {
        const roles = context.currentUser?.roles?.map(r => r.name?.toLowerCase?.() ?? '') || [];
        const email = context.currentUser?.email?.toLowerCase() || '';
        const isAdmin = roles.includes('administrator') || roles.includes('developer');
        const workspaceGroups = getWorkspaceGroups(context.currentUser);
        if (!workspaceGroups.has(MEDIA_GROUP_EMAIL)) {
            const apiGroups = await fetchWorkspaceGroupsFromApi(context.client);
            apiGroups.forEach(groupEmail => workspaceGroups.add(groupEmail));
        }
        const isMediaGroupMember = workspaceGroups.has(MEDIA_GROUP_EMAIL);
        const isMedia = isMediaGroupMember || email === MEDIA_GROUP_EMAIL;
        return prev.filter(tool => {
            if (tool.name === 'vision') {
                return isAdmin;
            }
            if (tool.name === 'calendar-sync') {
                return isAdmin || isMedia;
            }
            return true;
        });
    },
    vite: {
        define: {
            'process.env': {},
        },
    },
})
