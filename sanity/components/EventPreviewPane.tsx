import {useState} from 'react'

interface Props {
  document?: {
    slug?: {current?: string}
    _rev?: string
  }
}

const baseUrl =
  import.meta.env.SANITY_STUDIO_SITE_URL ||
  import.meta.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000'

export default function EventPreviewPane({document}: Props) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const slug = document?.slug?.current
  const rev = document?._rev
  const url = slug ? new URL('/api/preview', baseUrl) : undefined
  if (url) {
    url.searchParams.set('slug', `/events/${slug}`)
    url.searchParams.set('theme', theme)
    if (rev) url.searchParams.set('rev', rev)
  }
  return (
    <div className="flex h-full flex-col">
      <div className="space-x-2 p-2 text-right">
        <button
          type="button"
          onClick={() => setTheme('light')}
          className="rounded border px-2 py-1"
        >
          Light
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className="rounded border px-2 py-1"
        >
          Dark
        </button>
      </div>
      {url ? (
        <iframe
          key={url.toString()}
          src={url.toString()}
          className="h-full w-full flex-1 border-0"
        />
      ) : (
        <p className="p-4 text-center">Enter a slug to see a preview.</p>
      )}
    </div>
  )
}
