export type VimeoVideo = {
  uri: string
  name: string
  link: string
  pictures?: { sizes: { link: string }[] }
  live?: { status?: string }
  stats?: { viewers?: number }
}

export type VimeoItem = VimeoVideo & { id: string }

const user = process.env.VIMEO_USER_ID
const token = process.env.VIMEO_ACCESS_TOKEN
const headers: HeadersInit | undefined = token
  ? { Authorization: `Bearer ${token}` }
  : undefined

function idFromUri(uri: string) {
  const parts = uri.split("/")
  return parts[parts.length - 1]
}

export async function getCurrentLivestream(): Promise<VimeoItem | null> {
  if (!user || !token) return null
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
  if (!user || !token) return []
  const res = await fetch(
    `https://api.vimeo.com/users/${user}/videos?filter=live&per_page=10&sort=date&direction=desc&fields=uri,name,link,pictures.sizes.link`,
    { headers, next: { revalidate: 60 } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (
    data.data?.map((v: VimeoVideo) => ({ ...v, id: idFromUri(v.uri) })) ?? []
  )
}
