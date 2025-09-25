import { shouldBypassVimeoCache } from './serviceTimes'

export type VimeoVideo = {
  uri: string
  name: string
  link: string
  pictures?: { sizes: { link: string }[] }
  live?: { status?: string; scheduled_time?: string; ended_time?: string }
  privacy?: { view?: string; embed?: string }
  stats?: { viewers?: number }
  created_time?: string
  release_time?: string
  modified_time?: string
}

export type VimeoItem = VimeoVideo & { id: string }

async function getConfig() {
  const user = process.env.VIMEO_USER_ID
  const token = process.env.VIMEO_ACCESS_TOKEN
  if (!user || !token) {
    console.error('[Vimeo] Missing credentials: set VIMEO_USER_ID and VIMEO_ACCESS_TOKEN in your environment.')
    return null
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Vimeo] getConfig', { userPresent: Boolean(user), tokenPresent: Boolean(token) })
  }
  return { user, headers: { Authorization: `Bearer ${token}` } as HeadersInit }
}

function idFromUri(uri: string) {
  const parts = uri.split("/")
  return parts[parts.length - 1]
}

const VIMEO_REVALIDATE_SECONDS = 300

function buildFetchOptions(headers: HeadersInit, bypassCache: boolean) {
  if (bypassCache) {
    return { headers, cache: 'no-store' as const }
  }
  return { headers, next: { revalidate: VIMEO_REVALIDATE_SECONDS } }
}

export async function getCurrentLivestream(): Promise<VimeoItem | null> {
  const config = await getConfig()
  if (!config) return null
  const { user, headers } = config
  const params =
    'filter=live&per_page=5&sort=date&direction=desc&fields=uri,name,link,pictures.sizes.link,live.status,live.scheduled_time,live.ended_time,stats.viewers,created_time,release_time,modified_time,privacy.view,privacy.embed'
  const url = `https://api.vimeo.com/users/${user}/videos?${params}`
  let res: Response
  let dt: number
  let bypassCache = false
  try {
    bypassCache = await shouldBypassVimeoCache()
  } catch (error) {
    console.error('[Vimeo] Failed evaluating livestream cache guard', error)
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Vimeo] getCurrentLivestream cache guard', { bypassCache })
  }

  {
    const t0 = Date.now()
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Vimeo] getCurrentLivestream → fetch', { url })
    }
    res = await fetch(url, buildFetchOptions(headers, bypassCache))
    dt = Date.now() - t0
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Vimeo] getCurrentLivestream ← response', { status: res.status, durationMs: dt })
    }
  }

  if (!res.ok && res.status === 404) {
    const meUrl = `https://api.vimeo.com/me/videos?${params}`
    const t1 = Date.now()
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Vimeo] /users/{user}/videos returned 404 — retrying /me/videos', { meUrl })
    }
    const retry = await fetch(meUrl, buildFetchOptions(headers, bypassCache))
    const dt1 = Date.now() - t1
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Vimeo] getCurrentLivestream ← /me/videos response', { status: retry.status, durationMs: dt1 })
    }
    if (retry.ok) {
      res = retry
      dt = dt1
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    console.error('[Vimeo] current livestream request failed', res.status, text)
    return null
  }

  const data = await res.json()
  const items: VimeoVideo[] = Array.isArray(data?.data) ? data.data : []
  const streaming = items.find((item) => item?.live?.status === 'streaming')
  const video = streaming || items[0]

  if (!video) {
    console.warn('[Vimeo] current livestream: no video returned')
    return null
  }

  return { ...video, id: idFromUri(video.uri) }
}

export async function getRecentLivestreams(): Promise<VimeoItem[]> {
  // Use Live Events as the canonical source of recent livestreams, then resolve each event's archive video
  const config = await getConfig()
  if (!config) return []
  const { user, headers } = config
  let bypassCache = false
  try {
    bypassCache = await shouldBypassVimeoCache()
  } catch (error) {
    console.error('[Vimeo] Failed evaluating recent livestream cache guard', error)
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Vimeo] getRecentLivestreams → start', { user, bypassCache })
  }

  // 1) Fetch recent live events
  const evUrl = `https://api.vimeo.com/users/${user}/live_events?per_page=10&sort=modified_time&direction=desc&fields=uri,name,pictures.sizes.link,stream_status,status,schedule.time,ended_time`
  let evRes: Response
  let evDt: number
  {
    const t0 = Date.now()
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Vimeo] getRecentLivestreams → fetch events', { url: evUrl })
    }
    evRes = await fetch(evUrl, buildFetchOptions(headers, bypassCache))
    evDt = Date.now() - t0
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Vimeo] getRecentLivestreams ← events response', { status: evRes.status, durationMs: evDt })
    }
  }

  // If the user-scoped endpoint 404s, try the token-scoped /me endpoint (team/permissions often require this)
  if (!evRes.ok && evRes.status === 404) {
    const meUrl = `https://api.vimeo.com/me/live_events?per_page=10&sort=modified_time&direction=desc&fields=uri,name,pictures.sizes.link,stream_status,status,schedule.time,ended_time`
    const t1 = Date.now()
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Vimeo] /users/{user}/live_events returned 404 — retrying /me/live_events', { meUrl })
    }
    const retry = await fetch(meUrl, buildFetchOptions(headers, bypassCache))
    const dt1 = Date.now() - t1
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Vimeo] getRecentLivestreams ← /me/events response', { status: retry.status, durationMs: dt1 })
    }
    if (retry.ok) {
      evRes = retry
    }
  }

  if (!evRes.ok) {
    const text = await evRes.text().catch(() => "")
    console.error('[Vimeo] live_events request failed', evRes.status, text, '\nPossible causes: wrong user context (team token requires /me), token missing scopes (public, private, video_files, live), or account plan without Live Events API access.')
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Vimeo] Falling back to videos endpoint for recents')
    }
    return await getRecentFromVideosEndpoint(bypassCache)
  }

  const evData = await evRes.json()
  const events: any[] = Array.isArray(evData?.data) ? evData.data : []
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Vimeo] getRecentLivestreams events count', { count: events.length })
  }
  if (events.length === 0) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Vimeo] No live events returned; falling back to videos endpoint for recents')
    }
    return await getRecentFromVideosEndpoint(bypassCache)
  }

  // 2) For each event, fetch the latest video generated from it (archive). Keep the ones that exist).
  const items = await Promise.all(
    events.map(async (ev) => {
      try {
        const eventId = idFromUri(ev.uri)
        const vUrl = `https://api.vimeo.com/live_events/${eventId}/videos?per_page=1&sort=date&direction=desc&fields=uri,name,link,pictures.sizes.link,created_time,release_time,modified_time,live.status,live.scheduled_time,live.ended_time,status,privacy.view,privacy.embed`
        const vt0 = Date.now()
        const vRes = await fetch(vUrl, buildFetchOptions(headers, bypassCache))
        const vDt = Date.now() - vt0
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Vimeo] resolve event → videos', { eventId, status: vRes.status, durationMs: vDt })
        }
        if (!vRes.ok) {
          const text = await vRes.text().catch(() => "")
          console.error('[Vimeo] live_event → videos request failed', { eventId, status: vRes.status, body: text })
          return null
        }
        const vData = await vRes.json()
        const video: VimeoVideo | undefined = vData?.data?.[0]
        if (!video) {
          console.warn('[Vimeo] live_event has no archive video', { eventId })
          return null
        }
        const merged: VimeoItem = {
          ...video,
          // Prefer the archive's live times, but fall back to the event's ended_time when missing
          live: {
            status: video.live?.status,
            scheduled_time: video.live?.scheduled_time,
            ended_time: video.live?.ended_time || ev?.ended_time || undefined,
          },
          // Inherit a cover if needed (video pictures normally exist; event pictures as fallback)
          pictures: video.pictures || ev?.pictures,
          id: idFromUri(video.uri),
        }
        return merged
      } catch (e) {
        console.error('[Vimeo] Failed resolving live_event to video:', e)
        return null
      }
    })
  )

  const result = items.filter(Boolean) as VimeoItem[]
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Vimeo] getRecentLivestreams result count', { count: result.length })
  }
  if (result.length === 0) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Vimeo] No archives resolved from live events; falling back to videos endpoint for recents')
    }
    return await getRecentFromVideosEndpoint(bypassCache)
  }
  return result
}


export async function getRecentFromVideosEndpoint(bypassCache = false): Promise<VimeoItem[]> {
  const config = await getConfig()
  if (!config) return []
  const { user, headers } = config
  const url = `https://api.vimeo.com/users/${user}/videos?per_page=10&sort=date&direction=desc&fields=uri,name,link,pictures.sizes.link,live.status,live.scheduled_time,live.ended_time,created_time,release_time,modified_time,privacy.view,privacy.embed`
  const t0 = Date.now()
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Vimeo] Fallback → users/{user}/videos fetch', { url, bypassCache })
  }
  const res = await fetch(url, buildFetchOptions(headers, bypassCache))
  const dt = Date.now() - t0
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Vimeo] Fallback ← videos response', { status: res.status, durationMs: dt })
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[Vimeo] Fallback videos request failed', res.status, text)
    return []
  }
  const data = await res.json()
  const items = (data.data ?? []).map((v: VimeoVideo) => ({ ...v, id: idFromUri(v.uri) })) as VimeoItem[]
  // Prefer live-ended/streaming items; if none, return whatever we have so the page can still show something.
  const liveItems = items.filter(i => i.live?.status === 'ended' || i.live?.status === 'streaming')
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Vimeo] Fallback videos result count', { count: liveItems.length || items.length })
  }
  return liveItems.length ? liveItems : items
}
