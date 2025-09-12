import React from 'react'
import {definePlugin} from 'sanity'

const containerStyle: React.CSSProperties = {
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
}

const headerStyle: React.CSSProperties = {
  padding: 16,
  borderBottom: '1px solid var(--card-border-color)'
}

const bodyStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
}

const iframeStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 0,
}

function AnalyticsTool(props: { url?: string }) {
  // Prefer URL passed from config; fall back to envs for robustness
  const url = props.url || (
    ((import.meta as any)?.env?.SANITY_STUDIO_GA_DASHBOARD_URL as string | undefined) ||
    (typeof process !== 'undefined' ? (process as any)?.env?.SANITY_STUDIO_GA_DASHBOARD_URL : undefined) ||
    (typeof process !== 'undefined' ? (process as any)?.env?.NEXT_PUBLIC_GA_DASHBOARD_URL : undefined)
  )

  if (!url) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h2 style={{margin: 0}}>Analytics</h2>
        </div>
        <div style={{padding: 16}}>
          <p style={{marginTop: 0}}>
            No dashboard URL configured.
          </p>
          <p>
            Set the environment variable <code>SANITY_STUDIO_GA_DASHBOARD_URL</code> to a public dashboard link
            (for example, a shared Looker Studio report URL) to view your Google Analytics inside Studio.
          </p>
        </div>
      </div>
    )
  }

  // Ensure we use the embed URL variant for Looker Studio to avoid X-Frame-Options issues
  const embedUrl = url.includes('lookerstudio.google.com/reporting/')
    ? url.replace('lookerstudio.google.com/reporting/', 'lookerstudio.google.com/embed/reporting/')
    : url

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{margin: 0}}>Analytics</h2>
      </div>
      <div style={bodyStyle}>
        <iframe src={embedUrl} style={iframeStyle} allow="clipboard-write; fullscreen" referrerPolicy="no-referrer-when-downgrade"/>
      </div>
    </div>
  )
}

export const analyticsTool = definePlugin<{ url?: string }>(({url} = {}) => ({
  name: 'analytics-tool',
  tools: (prev) => [
    ...prev,
    {
      name: 'analytics',
      title: 'Analytics',
      component: () => <AnalyticsTool url={url} />,
    },
  ],
}))
