import { siteSettings } from "@/lib/queries"

export type VimeoVideo = {
  uri: string
  name: string
  link: string
  pictures?: { sizes: { link: string }[] }
  live?: { status?: string }
  stats?: { viewers?: number }
  created_time?: string
}

export type VimeoItem = VimeoVideo & { id: string }

async function getConfig() {
  const settings = await siteSettings()
  const user = settings?.vimeoUserId
  const token = settings?.vimeoAccessToken
  if (!user || !token) return null
  return { user, headers: { Authorization: `Bearer ${token}` } as HeadersInit }
}

function idFromUri(uri: string) {
  const parts = uri.split("/")
  return parts[parts.length - 1]
}

export async function getCurrentLivestream(): Promise<VimeoItem | null> {
  const config = await getConfig()
  if (!config) return null
  const { user, headers } = config
  const res = await fetch(
    `https://api.vimeo.com/users/${user}/videos?filter=live&per_page=1&sort=date&direction=desc&fields=uri,name,link,pictures.sizes.link,live.status,stats.viewers`,
    { headers, next: { revalidate: 60 } }
  )
  if (!res.ok) return null
  const data = await res.json()
  const video = data.data?.[0]
  if (!video) return null
  return { ...video, id: idFromUri(video.uri) }
}

export async function getRecentLivestreams(): Promise<VimeoItem[]> {
  const config = await getConfig()
  if (!config) return []
  const { user, headers } = config
  const res = await fetch(
    `https://api.vimeo.com/users/${user}/videos?filter=live&per_page=10&sort=date&direction=desc&fields=uri,name,link,pictures.sizes.link,live.status,created_time`,
    { headers, next: { revalidate: 60 } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (
    data.data?.map((v: VimeoVideo) => ({ ...v, id: idFromUri(v.uri) })) ?? []
  )
}
