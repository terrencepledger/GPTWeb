/*
  Sync Next.js app routes (app/.../page.tsx) into Sanity `page` documents so editors can pick from an auto-generated list.
  - Ignores dynamic routes like [slug]
  - Ignores route groups like (marketing)
  - Creates/updates docs of type `page` with stable IDs derived from route path

  Env required:
  - SANITY_STUDIO_PROJECT_ID (or NEXT_PUBLIC_SANITY_PROJECT_ID)
  - SANITY_STUDIO_DATASET (or NEXT_PUBLIC_SANITY_DATASET)
  - SANITY_API_TOKEN (Editor or greater)
*/

const path = require('path')
try { require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') }); } catch (e) {}
const fs = require('fs')
const {createClient} = require('@sanity/client')

const repoRoot = path.resolve(__dirname, '..')
const appDir = path.join(repoRoot, 'app')

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_TOKEN

if (!projectId || !dataset || !token) {
  console.error('Missing required env: SANITY_STUDIO_PROJECT_ID, SANITY_STUDIO_DATASET, SANITY_API_TOKEN')
  process.exit(1)
}

const client = createClient({projectId, dataset, token, apiVersion: '2024-10-01', useCdn: false})

function isDynamic(name) {
  return name.startsWith('[') && name.endsWith(']')
}

function isRouteGroup(name) {
  return name.startsWith('(') && name.endsWith(')')
}

function toTitle(segment) {
  const clean = segment.replace(/[-_]+/g, ' ').trim()
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

function toSlugFromRoute(route) {
  if (route === '/') return 'home'
  return route.replace(/^\//, '').replace(/\//g, '-').replace(/^-+|-+$/g, '') || 'home'
}

function idFromRoute(route) {
  const safe = route.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/\//g, '__') || 'root'
  return `page__${safe}`
}

function collectRoutes(dir, baseSegments = []) {
  const entries = fs.readdirSync(dir, {withFileTypes: true})
  let pages = []

  const hasPage = entries.some((e) => e.isFile() && e.name === 'page.tsx')

  if (hasPage) {
    const visibleSegments = baseSegments.filter((s) => !isRouteGroup(s))
    const route = '/' + visibleSegments.join('/')
    const lastSegment = visibleSegments[visibleSegments.length - 1] || ''
    const title = route === '/' ? 'Home' : toTitle(lastSegment)
    const slug = toSlugFromRoute(route)
    const id = idFromRoute(route)
    pages.push({route, title, slug, id})
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const name = entry.name
      if (isDynamic(name)) continue
      const childDir = path.join(dir, name)
      pages = pages.concat(collectRoutes(childDir, [...baseSegments, name]))
    }
  }

  return pages
}

async function run() {
  if (!fs.existsSync(appDir)) {
    console.error(`app directory not found at ${appDir}`)
    process.exit(1)
  }

  const pages = collectRoutes(appDir).filter((p) => !p.route.startsWith('/api'))

  if (pages.length === 0) {
    console.warn('No pages discovered. Nothing to sync.')
    return
  }

  console.log(`Discovered ${pages.length} routes:`)
  for (const p of pages) console.log(` - ${p.route}`)

  const tx = client.transaction()
  for (const p of pages) {
    tx.createOrReplace({
      _id: p.id,
      _type: 'page',
      title: p.title,
      slug: {current: p.slug},
    })
  }

  await tx.commit()
  console.log('Sanity pages synced successfully.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
