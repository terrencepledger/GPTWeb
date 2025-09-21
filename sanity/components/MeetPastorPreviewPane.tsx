import {useEffect, useMemo, useState} from 'react'
import {PortableText, type PortableTextBlock, type PortableTextComponents} from '@portabletext/react'
import {useClient} from 'sanity'

interface Props {
  document?: {
    displayed?: {
      _id?: string
    }
  }
}

interface MeetPastorQuote {
  text?: string
  attribution?: string
}

interface MeetPastorSection {
  heading?: string
  body?: PortableTextBlock[]
  image?: {url?: string; alt?: string}
  values?: string[]
  highlights?: string[]
  quote?: MeetPastorQuote
}

interface MeetPastorMediaItem {
  _key?: string
  title?: string
  description?: string
  label?: string
  url?: string
}

interface MeetPastorContactMethod {
  _key?: string
  label?: string
  value?: string
  href?: string
}

interface MeetPastorTimelineEntry {
  _key?: string
  date?: string
  title?: string
  description?: string
}

interface MeetPastorTestimonial {
  _key?: string
  quote?: string
  name?: string
  role?: string
}

interface MeetPastorData {
  hero?: {
    title?: string
    subtitle?: string
    tagline?: string
    image?: string
    imageAlt?: string
  }
  quickFacts?: {label?: string; value?: string}[]
  highlightQuote?: MeetPastorQuote
  biographySection?: MeetPastorSection
  visionSection?: MeetPastorSection
  personalSection?: MeetPastorSection
  mediaSection?: {
    heading?: string
    intro?: PortableTextBlock[]
    items?: MeetPastorMediaItem[]
  }
  connectSection?: {
    heading?: string
    body?: PortableTextBlock[]
    cta?: {label?: string; href?: string}
    contactMethods?: MeetPastorContactMethod[]
  }
  timeline?: MeetPastorTimelineEntry[]
  testimonials?: MeetPastorTestimonial[]
}

const portableComponents: PortableTextComponents = {
  block: {
    normal: ({children}) => (
      <p style={{marginTop: 12, lineHeight: 1.6, color: 'rgb(55,65,81)'}}>{children}</p>
    ),
    h3: ({children}) => (
      <h3 style={{marginTop: 20, fontSize: 20, fontWeight: 600, color: 'rgb(30,41,59)'}}>{children}</h3>
    ),
    blockquote: ({children}) => (
      <blockquote
        style={{
          marginTop: 16,
          borderLeft: '4px solid rgb(148,163,184)',
          paddingLeft: 12,
          fontStyle: 'italic',
          color: 'rgb(30,41,59)',
        }}
      >
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({children}) => (
      <ul style={{marginTop: 12, paddingLeft: 20, color: 'rgb(55,65,81)'}}>{children}</ul>
    ),
    number: ({children}) => (
      <ol style={{marginTop: 12, paddingLeft: 20, color: 'rgb(55,65,81)'}}>{children}</ol>
    ),
  },
}

function RichText({value}: {value?: PortableTextBlock[]}) {
  if (!value || value.length === 0) return null
  return <PortableText value={value} components={portableComponents} />
}

function SectionPreview({
  section,
  fallbackHeading,
  listKey,
  listTitle,
  reverse,
}: {
  section?: MeetPastorSection
  fallbackHeading: string
  listKey?: 'values' | 'highlights'
  listTitle?: string
  reverse?: boolean
}) {
  if (!section) return null
  const body = section.body
  const image = section.image?.url
  const imageAlt = section.image?.alt || section.heading || fallbackHeading
  const list = listKey
    ? (section[listKey] || []).map(item => item?.trim()).filter(Boolean)
    : []
  const hasContent = Boolean(
    section.heading ||
      (body && body.length > 0) ||
      image ||
      (list && list.length > 0) ||
      (section.quote && section.quote.text)
  )
  if (!hasContent) return null

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        padding: 24,
        borderRadius: 24,
        border: '1px solid rgb(229,231,235)',
        backgroundColor: 'white',
        boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: reverse ? 'column-reverse' : 'column',
          gap: 20,
        }}
      >
        <div style={{flex: 1, minWidth: 0}}>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 600,
              marginBottom: 8,
              color: 'rgb(30,41,59)',
            }}
          >
            {section.heading || fallbackHeading}
          </h2>
          <RichText value={body} />
          {list && list.length > 0 && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 16,
                border: '1px solid rgb(226,232,240)',
                backgroundColor: 'rgb(248,250,252)',
              }}
            >
              {listTitle && (
                <p
                  style={{
                    fontSize: 12,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'rgb(100,116,139)',
                    marginBottom: 8,
                  }}
                >
                  {listTitle}
                </p>
              )}
              <ul style={{margin: 0, paddingLeft: 18, color: 'rgb(30,41,59)'}}>
                {list.map((item, index) => (
                  <li key={`${item}-${index}`} style={{marginTop: index === 0 ? 0 : 6}}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {section.quote?.text && (
            <blockquote
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 16,
                border: '1px solid rgb(226,232,240)',
                background: 'linear-gradient(135deg, rgba(30,64,175,0.08) 0%, rgba(59,130,246,0.08) 100%)',
                fontStyle: 'italic',
                color: 'rgb(30,41,59)',
              }}
            >
              “{section.quote.text}”
              {section.quote.attribution && (
                <footer
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'rgb(100,116,139)',
                  }}
                >
                  — {section.quote.attribution}
                </footer>
              )}
            </blockquote>
          )}
        </div>
        {image && (
          <div
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              border: '1px solid rgb(226,232,240)',
              alignSelf: 'stretch',
            }}
          >
            <img
              src={image}
              alt={imageAlt || ''}
              style={{display: 'block', width: '100%', height: '100%', objectFit: 'cover'}}
            />
          </div>
        )}
      </div>
    </section>
  )
}

const meetPastorQuery = `coalesce(
  *[_type == "meetPastor" && _id == $draftId][0],
  *[_type == "meetPastor" && _id == $publishedId][0]
){
  hero{
    title,
    subtitle,
    tagline,
    "image": image.asset->url,
    imageAlt
  },
  quickFacts[]{label, value},
  highlightQuote{ text, attribution },
  biographySection{
    heading,
    body,
    "image": image.asset->url,
    imageAlt,
    quote{ text, attribution }
  },
  visionSection{
    heading,
    body,
    values,
    quote{ text, attribution }
  },
  personalSection{
    heading,
    body,
    "image": image.asset->url,
    imageAlt,
    highlights,
    quote{ text, attribution }
  },
  mediaSection{
    heading,
    intro,
    items[]{ _key, title, description, label, url }
  },
  connectSection{
    heading,
    body,
    cta{ label, href },
    contactMethods[]{ _key, label, value, href }
  },
  timeline[]{ _key, date, title, description },
  testimonials[]{ _key, quote, name, role }
}`

export default function MeetPastorPreviewPane({document}: Props) {
  const client = useClient({apiVersion: '2025-08-01', perspective: 'previewDrafts'} as any)
  const [data, setData] = useState<MeetPastorData | null>(null)
  const [loading, setLoading] = useState(true)

  const baseId = useMemo(() => {
    const currentId = document?.displayed?._id
    if (!currentId) return 'meetPastor'
    return currentId.replace(/^drafts\./, '')
  }, [document?.displayed?._id])

  useEffect(() => {
    let ignore = false
    const params = {draftId: `drafts.${baseId}`, publishedId: baseId}

    const fetchData = () => {
      setLoading(true)
      client.fetch<MeetPastorData | null>(meetPastorQuery, params).then(res => {
        if (!ignore) {
          setData(res)
          setLoading(false)
        }
      })
    }

    fetchData()
    const subscription = client
      .listen(meetPastorQuery, params, {visibility: 'query'})
      .subscribe(() => fetchData())

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [client, baseId])

  const quickFacts = useMemo(
    () =>
      (data?.quickFacts || [])
        .map(fact => ({
          label: fact?.label?.trim(),
          value: fact?.value?.trim(),
        }))
        .filter(fact => fact.label || fact.value),
    [data?.quickFacts]
  )

  const contactMethods = useMemo(
    () =>
      (data?.connectSection?.contactMethods || [])
        .map(method => ({
          ...method,
          label: method?.label?.trim(),
          value: method?.value?.trim(),
          href: method?.href?.trim(),
        }))
        .filter(method => method.label || method.value || method.href),
    [data?.connectSection?.contactMethods]
  )

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'rgb(248,250,252)'}}>
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid rgb(229,231,235)',
          backgroundColor: 'white',
          textTransform: 'uppercase',
          letterSpacing: '0.3em',
          fontSize: 12,
          color: 'rgb(100,116,139)',
        }}
      >
        Meet the Pastor Preview
      </div>
      <div style={{flex: 1, overflow: 'auto'}}>
        <div style={{padding: 24, maxWidth: 960, margin: '0 auto'}}>
          {loading && !data && (
            <p style={{textAlign: 'center', color: 'rgb(100,116,139)'}}>Loading preview…</p>
          )}
          {!loading && !data && (
            <p style={{textAlign: 'center', color: 'rgb(100,116,139)'}}>
              Start adding content to see a preview of the Meet the Pastor page.
            </p>
          )}
          {data && (
            <div style={{display: 'flex', flexDirection: 'column', gap: 32}}>
              <section
                style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  border: '1px solid rgb(229,231,235)',
                  boxShadow: '0 20px 45px rgba(15,23,42,0.08)',
                  backgroundColor: 'white',
                }}
              >
                {data.hero?.image && (
                  <div style={{position: 'relative', paddingTop: '45%', backgroundColor: 'rgb(15,23,42)'}}>
                    <img
                      src={data.hero.image}
                      alt={data.hero.imageAlt || data.hero.title || 'Hero image'}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                )}
                <div style={{padding: data.hero?.image ? 32 : 24}}>
                  {data.hero?.tagline && (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        borderRadius: 999,
                        border: '1px solid rgb(226,232,240)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3em',
                        fontSize: 12,
                        color: 'rgb(79,70,229)',
                        marginBottom: 12,
                      }}
                    >
                      {data.hero.tagline}
                    </span>
                  )}
                  <h1 style={{fontSize: 34, fontWeight: 700, color: 'rgb(30,41,59)', margin: 0}}>
                    {data.hero?.title || 'Meet the Pastor'}
                  </h1>
                  {data.hero?.subtitle && (
                    <p style={{marginTop: 12, fontSize: 18, lineHeight: 1.6, color: 'rgb(71,85,105)'}}>
                      {data.hero.subtitle}
                    </p>
                  )}
                </div>
              </section>

              {quickFacts.length > 0 && (
                <section
                  style={{
                    display: 'grid',
                    gap: 16,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  }}
                >
                  {quickFacts.map((fact, index) => (
                    <div
                      key={`${fact.label || fact.value || index}`}
                      style={{
                        borderRadius: 20,
                        border: '1px solid rgb(226,232,240)',
                        backgroundColor: 'white',
                        padding: 20,
                        boxShadow: '0 10px 20px rgba(15,23,42,0.05)',
                      }}
                    >
                      {fact.label && (
                        <p
                          style={{
                            fontSize: 12,
                            letterSpacing: '0.3em',
                            textTransform: 'uppercase',
                            color: 'rgb(100,116,139)',
                            marginBottom: 6,
                          }}
                        >
                          {fact.label}
                        </p>
                      )}
                      {fact.value && (
                        <p style={{fontSize: 20, fontWeight: 600, color: 'rgb(30,41,59)', margin: 0}}>{fact.value}</p>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {data.highlightQuote?.text && (
                <section
                  style={{
                    borderRadius: 24,
                    border: '1px solid rgb(226,232,240)',
                    padding: 28,
                    background:
                      'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(30,64,175,0.12) 100%)',
                    boxShadow: '0 20px 45px rgba(37,99,235,0.12)',
                    textAlign: 'center',
                  }}
                >
                  <p style={{fontSize: 24, fontWeight: 600, color: 'rgb(30,41,59)'}}>
                    “{data.highlightQuote.text}”
                  </p>
                  {data.highlightQuote.attribution && (
                    <p
                      style={{
                        marginTop: 12,
                        fontSize: 12,
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        color: 'rgb(100,116,139)',
                      }}
                    >
                      — {data.highlightQuote.attribution}
                    </p>
                  )}
                </section>
              )}

              <SectionPreview section={data.biographySection} fallbackHeading="Biography & Ministry Journey" reverse />

              <SectionPreview
                section={data.visionSection}
                fallbackHeading="Vision & Values"
                listKey="values"
                listTitle="Core Values"
              />

              <SectionPreview
                section={data.personalSection}
                fallbackHeading="Personal Life"
                listKey="highlights"
                listTitle="Highlights"
                reverse
              />

              {(data.mediaSection?.heading || data.mediaSection?.intro || data.mediaSection?.items?.length) && (
                <section
                  style={{
                    borderRadius: 24,
                    border: '1px solid rgb(226,232,240)',
                    padding: 28,
                    backgroundColor: 'white',
                    boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                  }}
                >
                  <h2 style={{fontSize: 26, fontWeight: 600, color: 'rgb(30,41,59)'}}>
                    {data.mediaSection?.heading || 'Media & Resources'}
                  </h2>
                  <RichText value={data.mediaSection?.intro} />
                  {data.mediaSection?.items && data.mediaSection.items.length > 0 && (
                    <div
                      style={{
                        display: 'grid',
                        gap: 16,
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      }}
                    >
                      {data.mediaSection.items.map(item => {
                        if (!item || (!item.title && !item.description && !item.url)) return null
                        return (
                          <article
                            key={item._key}
                            style={{
                              borderRadius: 20,
                              border: '1px solid rgb(226,232,240)',
                              padding: 20,
                              backgroundColor: 'rgb(248,250,252)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 12,
                              height: '100%',
                            }}
                          >
                            <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                              {item.label && (
                                <span
                                  style={{
                                    alignSelf: 'flex-start',
                                    padding: '4px 12px',
                                    borderRadius: 999,
                                    border: '1px solid rgb(203,213,225)',
                                    fontSize: 12,
                                    letterSpacing: '0.3em',
                                    textTransform: 'uppercase',
                                    color: 'rgb(79,70,229)',
                                  }}
                                >
                                  {item.label}
                                </span>
                              )}
                              {item.title && (
                                <h3 style={{fontSize: 20, fontWeight: 600, color: 'rgb(30,41,59)', margin: 0}}>{item.title}</h3>
                              )}
                              {item.description && (
                                <p style={{margin: 0, color: 'rgb(71,85,105)'}}>{item.description}</p>
                              )}
                            </div>
                            {item.url && (
                              <span style={{marginTop: 'auto', fontSize: 14, color: 'rgb(37,99,235)'}}>
                                {item.url}
                              </span>
                            )}
                          </article>
                        )
                      })}
                    </div>
                  )}
                </section>
              )}

              {data.timeline && data.timeline.length > 0 && (
                <section
                  style={{
                    borderRadius: 24,
                    border: '1px solid rgb(226,232,240)',
                    padding: 28,
                    backgroundColor: 'white',
                    boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                  }}
                >
                  <h2 style={{fontSize: 26, fontWeight: 600, color: 'rgb(30,41,59)'}}>Ministry Timeline</h2>
                  <ol style={{listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16}}>
                    {data.timeline.map(entry => {
                      if (!entry || (!entry.date && !entry.title && !entry.description)) return null
                      return (
                        <li
                          key={entry._key}
                          style={{
                            paddingLeft: 16,
                            borderLeft: '3px solid rgb(59,130,246)',
                            color: 'rgb(55,65,81)',
                          }}
                        >
                          {entry.date && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 12,
                                letterSpacing: '0.3em',
                                textTransform: 'uppercase',
                                color: 'rgb(100,116,139)',
                              }}
                            >
                              {entry.date}
                            </p>
                          )}
                          {entry.title && (
                            <p style={{margin: '4px 0', fontSize: 18, fontWeight: 600, color: 'rgb(30,41,59)'}}>{entry.title}</p>
                          )}
                          {entry.description && (
                            <p style={{margin: 0}}>{entry.description}</p>
                          )}
                        </li>
                      )
                    })}
                  </ol>
                </section>
              )}

              {data.testimonials && data.testimonials.length > 0 && (
                <section
                  style={{
                    borderRadius: 24,
                    border: '1px solid rgb(226,232,240)',
                    padding: 28,
                    backgroundColor: 'white',
                    boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                  }}
                >
                  <h2 style={{fontSize: 26, fontWeight: 600, color: 'rgb(30,41,59)'}}>Voices from the Congregation</h2>
                  <div
                    style={{
                      display: 'grid',
                      gap: 16,
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    }}
                  >
                    {data.testimonials.map(testimonial => {
                      if (!testimonial?.quote) return null
                      return (
                        <figure
                          key={testimonial._key}
                          style={{
                            borderRadius: 20,
                            border: '1px solid rgb(226,232,240)',
                            backgroundColor: 'rgb(248,250,252)',
                            padding: 20,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                          }}
                        >
                          <blockquote style={{margin: 0, fontStyle: 'italic', color: 'rgb(30,41,59)'}}>
                            “{testimonial.quote}”
                          </blockquote>
                          {(testimonial.name || testimonial.role) && (
                            <figcaption
                              style={{
                                fontSize: 12,
                                letterSpacing: '0.3em',
                                textTransform: 'uppercase',
                                color: 'rgb(100,116,139)',
                              }}
                            >
                              {testimonial.name}
                              {testimonial.role ? `, ${testimonial.role}` : ''}
                            </figcaption>
                          )}
                        </figure>
                      )
                    })}
                  </div>
                </section>
              )}

              {(data.connectSection?.heading || data.connectSection?.body || contactMethods.length > 0 ||
                (data.connectSection?.cta?.label && data.connectSection?.cta?.href)) && (
                <section
                  style={{
                    borderRadius: 24,
                    border: '1px solid rgb(226,232,240)',
                    padding: 28,
                    background:
                      'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(37,99,235,0.1) 100%)',
                    boxShadow: '0 20px 45px rgba(37,99,235,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                  }}
                >
                  <h2 style={{fontSize: 26, fontWeight: 600, color: 'rgb(30,41,59)'}}>
                    {data.connectSection?.heading || 'Connect'}
                  </h2>
                  <RichText value={data.connectSection?.body} />
                  {data.connectSection?.cta?.label && data.connectSection.cta.href && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 20px',
                        borderRadius: 999,
                        backgroundColor: 'white',
                        color: 'rgb(37,99,235)',
                        fontWeight: 600,
                        boxShadow: '0 10px 25px rgba(59,130,246,0.2)',
                        width: 'fit-content',
                      }}
                    >
                      {data.connectSection.cta.label}
                    </span>
                  )}
                  {contactMethods.length > 0 && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                      {contactMethods.map(method => (
                        <div
                          key={method._key}
                          style={{
                            borderRadius: 16,
                            border: '1px solid rgb(203,213,225)',
                            backgroundColor: 'white',
                            padding: 16,
                          }}
                        >
                          {method.label && (
                            <p
                              style={{
                                fontSize: 12,
                                letterSpacing: '0.3em',
                                textTransform: 'uppercase',
                                color: 'rgb(100,116,139)',
                                marginBottom: 6,
                              }}
                            >
                              {method.label}
                            </p>
                          )}
                          {method.href ? (
                            <p style={{margin: 0, fontSize: 18, color: 'rgb(37,99,235)'}}>{method.value || method.href}</p>
                          ) : (
                            method.value && <p style={{margin: 0, fontSize: 18, color: 'rgb(30,41,59)'}}>{method.value}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
