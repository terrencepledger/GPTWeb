import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {PortableText} from '@portabletext/react'

interface Props {
  document?: {
    displayed?: { slug?: { current?: string } }
  }
}

interface EventDetail {
  title: string
  body?: any
  palette?: any
  eventLogo?: { url: string; alt?: string }
  sections?: any[]
}

const colorMap: Record<string, string> = {
  purple: 'rgb(92,48,166)',
  gold: 'rgb(214,175,54)',
  ink: 'rgb(18,18,18)',
  white: 'rgb(255,255,255)',
  black: 'rgb(0,0,0)',
  gray: 'rgb(17,24,39)',
  darkred: 'rgb(127,29,29)',
}

function pickPalette(palette: any, mode: 'light' | 'dark') {
  const src = mode === 'dark' ? palette?.dark || {} : palette?.light || {}
  return {
    primary: src.primary ?? palette?.primary,
    accent: src.accent ?? palette?.accent,
    contrast: src.contrast ?? palette?.contrast,
  } as { primary?: string; accent?: string; contrast?: string }
}

export default function EventPreviewPane({document}: Props) {
  const client = useClient({ apiVersion: '2025-08-01' } as any)
  const slug = document?.displayed?.slug?.current
  const [data, setData] = useState<EventDetail | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    if (!slug) return
    const query = `*[_type=="eventDetail" && slug.current==$slug][0]{
      title,
      body,
      palette,
      "eventLogo": eventLogo{ "url": asset->url, "alt": coalesce(alt, "") },
      sections[]{
        _type,
        headline,
        subheadline,
        "backgroundImage": backgroundImage.asset->url,
        layout,
        images[]{ _key, "url": asset->url, "alt": coalesce(alt, "") },
        showSubscribe,
        address,
        mapType,
        formUrl
      }
    }`
    const params = { slug }
    let ignore = false
    client.fetch<EventDetail>(query, params).then(res => { if (!ignore) setData(res) })
    const sub = client.listen(query, params, { visibility: 'query' }).subscribe(() => {
      client.fetch<EventDetail>(query, params).then(res => { if (!ignore) setData(res) })
    })
    return () => { ignore = true; sub.unsubscribe() }
  }, [client, slug])

  if (!slug) return <p style={{padding:16, textAlign:'center'}}>Enter a slug to see a preview.</p>
  if (!data) return <p style={{padding:16, textAlign:'center'}}>Loading…</p>

  const sel = pickPalette(data.palette, theme)
  const primary = sel.primary ? colorMap[sel.primary] : undefined
  const accent = sel.accent ? colorMap[sel.accent] : undefined
  const contrast = sel.contrast ? colorMap[sel.contrast] : undefined
  const bg = primary ? (theme === 'dark' ? `color-mix(in oklab, ${primary} 18%, black)` : primary) : undefined
  const surface = primary ? (theme === 'dark' ? `color-mix(in oklab, ${primary} 26%, black)` : `color-mix(in oklab, ${primary} 85%, black)`) : undefined

  const style: React.CSSProperties = {
    '--brand-primary': primary,
    '--brand-accent': accent,
    '--brand-border': accent,
    '--brand-fg': contrast,
    '--brand-bg': bg,
    '--brand-surface': surface,
    backgroundColor: bg,
    color: contrast,
  } as any

  const hasHero = Array.isArray(data.sections) && data.sections.some(s => s._type === 'heroSection')

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div style={{display:'flex', justifyContent:'flex-end', gap:8, padding:8, borderBottom:'1px solid rgb(229,231,235)'}}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          aria-pressed={theme === 'light'}
          style={{border:'1px solid rgb(209,213,219)', borderRadius:4, padding:'4px 8px', backgroundColor: theme === 'light' ? 'rgb(229,231,235)' : 'transparent', cursor:'pointer'}}
        >
          Light
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          aria-pressed={theme === 'dark'}
          style={{border:'1px solid rgb(209,213,219)', borderRadius:4, padding:'4px 8px', backgroundColor: theme === 'dark' ? 'rgb(229,231,235)' : 'transparent', cursor:'pointer'}}
        >
          Dark
        </button>
      </div>
      <div style={{flex:1, overflow:'auto'}}>
        <article id="event-article" style={{...style, padding:16}} data-theme={theme}>
          {!hasHero && (
            <section style={{textAlign:'center', marginBottom:32}}>
              {data.eventLogo && (
                <img src={data.eventLogo.url} alt={data.eventLogo.alt || ''} style={{height:96, width:96, objectFit:'contain', margin:'0 auto'}} />
              )}
              <h1 style={{fontSize:24, fontWeight:700, color:'var(--brand-accent)'}}>{data.title}</h1>
              {data.body && (
                <div style={{maxWidth:600, margin:'0 auto', color:'var(--brand-fg)'}}>
                  <PortableText value={data.body} />
                </div>
              )}
            </section>
          )}
          {data.sections?.map((section, idx) => {
            switch (section._type) {
              case 'heroSection':
                return (
                  <section key={idx} style={{textAlign:'center', marginBottom:32}}>
                    {section.backgroundImage && (
                      <img src={section.backgroundImage} alt="" style={{width:'100%', maxHeight:256, objectFit:'cover', borderRadius:4}} />
                    )}
                    {data.eventLogo && (
                      <img src={data.eventLogo.url} alt={data.eventLogo.alt || ''} style={{height:96, width:96, objectFit:'contain', margin:'16px auto'}} />
                    )}
                    <h1 style={{fontSize:24, fontWeight:700, color:'var(--brand-accent)'}}>{section.headline || data.title}</h1>
                    {section.subheadline && <p style={{color:'var(--brand-fg)'}}>{section.subheadline}</p>}
                    {data.body && (
                      <div style={{maxWidth:600, margin:'0 auto', color:'var(--brand-fg)'}}>
                        <PortableText value={data.body} />
                      </div>
                    )}
                  </section>
                )
              case 'gallerySection':
                return (
                  <section key={idx} style={{marginBottom:32}}>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:8}}>
                      {section.images?.map((img: any) => (
                        <img key={img._key} src={img.url} alt={img.alt || ''} style={{width:'100%', height:120, objectFit:'cover', borderRadius:4}} />
                      ))}
                    </div>
                  </section>
                )
              case 'calendarSection':
                return (
                  <section key={idx} style={{marginBottom:32}}>
                    <p style={{color:'var(--brand-fg)'}}>Calendar preview unavailable in studio.</p>
                  </section>
                )
              case 'mapSection':
                return (
                  <section key={idx} style={{marginBottom:32}}>
                    <p style={{color:'var(--brand-fg)'}}>Map preview unavailable in studio.</p>
                  </section>
                )
              case 'registrationSection':
                return (
                  <section key={idx} style={{marginBottom:32}}>
                    <a href={section.formUrl} style={{color:'var(--brand-accent)'}}>Register</a>
                  </section>
                )
              default:
                return null
            }
          })}
        </article>
      </div>
    </div>
  )
}
