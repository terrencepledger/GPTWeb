import {useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'

interface Props {
  document?: {
    displayed?: {
      slug?: { current?: string }
      _rev?: string
      [key: string]: any
    }
    slug?: { current?: string }
    _rev?: string
  }
}

function getBaseUrl(): string {
  const nodeEnv = (typeof process !== 'undefined' && process?.env) ? process.env : ({} as any)
  let viteEnv: any = {}
  try {
    // @ts-ignore
    viteEnv = (import.meta && (import.meta as any).env) || {}
  } catch {
    // ignore
  }
  return (
    nodeEnv.SANITY_STUDIO_SITE_URL ||
    nodeEnv.NEXT_PUBLIC_SITE_URL ||
    viteEnv.SANITY_STUDIO_SITE_URL ||
    viteEnv.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  )
}

export default function EventPreviewPane({document}: Props) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [bust, setBust] = useState(0)
  const baseUrl = useMemo(() => getBaseUrl(), [])

  const displayed = document?.displayed as any
  const slug = displayed?.slug?.current ?? document?.slug?.current
  const rev = displayed?._rev ?? document?._rev
  const docId = (displayed as any)?._id || (document as any)?._id

  // Build a signature of the current document state. Prefer _rev when available; otherwise
  // fall back to a JSON snapshot of displayed. This ensures we detect edits to drafts and
  // trigger a cache-busting reload of the iframe.
  const docSig = useMemo(() => {
    const r = rev || ''
    // Only include a few common fields to avoid huge strings, but keep a full fallback
    const light = displayed?.palette?.light
    const dark = displayed?.palette?.dark
    const sectionsLen = Array.isArray(displayed?.sections) ? displayed.sections.length : 0
    const bodyLen = Array.isArray(displayed?.body) ? displayed.body.length : (displayed?.body ? 1 : 0)
    const shallow = JSON.stringify({ r, slug, sectionsLen, bodyLen, light, dark, title: displayed?.title })
    return r ? `${r}:${slug}` : shallow
  }, [rev, slug, displayed])

  useEffect(() => {
    // Increment bust counter whenever the document signature changes
    setBust((b) => b + 1)
  }, [docSig])

  // Subscribe to live document changes using Sanity client.listen to ensure we reload on any patch
  const client = useClient({ apiVersion: '2025-08-01' } as any)
  useEffect(() => {
    if (!docId) return
    const sub = client
      .listen(`*[_id == $id][0]`, { id: docId }, { visibility: 'query' })
      .subscribe(() => {
        setBust((b) => b + 1)
      })
    return () => sub.unsubscribe()
  }, [client, docId])

  const url = slug ? new URL('/api/preview', baseUrl) : undefined
  if (url) {
    url.searchParams.set('slug', `/events/${slug}`)
    url.searchParams.set('theme', theme)
    url.searchParams.set('draft', '1')
    if (rev) url.searchParams.set('rev', String(rev))
    url.searchParams.set('ts', String(bust)) // force iframe reload on edits
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%', minHeight:0, width:'100%'}}>
      <div style={{display:'flex', justifyContent:'flex-end', gap:8, padding:8, borderBottom:'1px solid #e5e7eb'}}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          aria-pressed={theme === 'light'}
          style={{
            border:'1px solid #d1d5db',
            borderRadius:4,
            padding:'4px 8px',
            backgroundColor: theme === 'light' ? '#e5e7eb' : 'transparent',
            cursor:'pointer'
          }}
        >
          Light
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          aria-pressed={theme === 'dark'}
          style={{
            border:'1px solid #d1d5db',
            borderRadius:4,
            padding:'4px 8px',
            backgroundColor: theme === 'dark' ? '#e5e7eb' : 'transparent',
            cursor:'pointer'
          }}
        >
          Dark
        </button>
      </div>
      {url ? (
        <iframe
          key={url.toString()}
          src={url.toString()}
          style={{flex:1, minHeight:0, width:'100%', border:0}}
        />
      ) : (
        <p style={{padding:16, textAlign:'center'}}>Enter a slug to see a preview.</p>
      )}
    </div>
  )
}
