import { useState } from 'react';
import { Iframe } from 'sanity-plugin-iframe-pane';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function EventDetailPreview(props: any) {
  const { document } = props;
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const slug = document?.displayed?.slug?.current;
  const url = slug
    ? `${baseUrl}/api/preview?slug=/events/${slug}&theme=${theme}`
    : baseUrl;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--card-border-color)', display: 'flex', gap: '0.5rem' }}>
        <button type="button" disabled={theme === 'light'} onClick={() => setTheme('light')}>Light</button>
        <button type="button" disabled={theme === 'dark'} onClick={() => setTheme('dark')}>Dark</button>
      </div>
      <Iframe {...props} options={{ url, reload: { button: true } }} />
    </div>
  );
}
