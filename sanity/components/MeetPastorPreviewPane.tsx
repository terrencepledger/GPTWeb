import { useEffect, useMemo, useState } from 'react';
import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponents,
} from '@portabletext/react';
import { useClient } from 'sanity';

interface Props {
  document?: {
    displayed?: {
      _id?: string;
    };
  };
}

interface MeetPastorSection {
  heading?: string;
  body?: PortableTextBlock[];
  image?: string;
  imageAlt?: string;
}

interface MeetPastorMediaItem {
  _key?: string;
  title?: string;
  description?: string;
  label?: string;
  url?: string;
}

interface MeetPastorData {
  hero?: {
    title?: string;
    subtitle?: string;
    image?: string;
    imageAlt?: string;
  };
  biographySection?: MeetPastorSection;
  personalSection?: MeetPastorSection;
  mediaSection?: {
    heading?: string;
    intro?: PortableTextBlock[];
    items?: MeetPastorMediaItem[];
  };
}

const portableComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p style={{ marginTop: 12, lineHeight: 1.6, color: 'rgb(55,65,81)' }}>{children}</p>
    ),
    h3: ({ children }) => (
      <h3 style={{ marginTop: 20, fontSize: 20, fontWeight: 600, color: 'rgb(30,41,59)' }}>{children}</h3>
    ),
    blockquote: ({ children }) => (
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
    bullet: ({ children }) => (
      <ul style={{ marginTop: 12, paddingLeft: 20, color: 'rgb(55,65,81)' }}>{children}</ul>
    ),
    number: ({ children }) => (
      <ol style={{ marginTop: 12, paddingLeft: 20, color: 'rgb(55,65,81)' }}>{children}</ol>
    ),
  },
};

function RichText({ value }: { value?: PortableTextBlock[] | null }) {
  if (!value || value.length === 0) return null;
  return <PortableText value={value} components={portableComponents} />;
}

function SectionPreview({
  section,
  fallbackHeading,
  reverse,
}: {
  section?: MeetPastorSection | null;
  fallbackHeading: string;
  reverse?: boolean;
}) {
  if (!section) return null;

  const hasBody = Array.isArray(section.body) && section.body.length > 0;
  const hasImage = Boolean(section.image);
  const heading = section.heading || fallbackHeading;

  if (!hasBody && !hasImage && !heading) return null;

  return (
    <section
      style={{
        display: 'grid',
        gap: 24,
        gridTemplateColumns: hasImage ? 'minmax(0,3fr) minmax(0,2fr)' : 'minmax(0,1fr)',
        alignItems: hasImage ? 'center' : undefined,
      }}
    >
      <div style={{ order: hasImage && reverse ? 2 : 1 }}>
        {heading && (
          <h2 style={{ fontSize: 26, fontWeight: 600, color: 'rgb(30,41,59)', marginBottom: 12 }}>{heading}</h2>
        )}
        <RichText value={section.body} />
      </div>
      {hasImage && section.image && (
        <div
          style={{
            order: reverse ? 1 : 2,
            borderRadius: 24,
            overflow: 'hidden',
            border: '1px solid rgb(226,232,240)',
            backgroundColor: 'white',
            minHeight: 240,
          }}
        >
          <img
            src={section.image}
            alt={section.imageAlt || heading || ''}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
    </section>
  );
}

function MediaPreview({ media }: { media?: MeetPastorData['mediaSection'] }) {
  const items = media?.items?.filter((item) => item && (item.title || item.description || item.url));

  if (!media?.heading && (!items || items.length === 0) && (!media?.intro || media.intro.length === 0)) {
    return null;
  }

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 24,
        borderRadius: 24,
        border: '1px solid rgb(226,232,240)',
        backgroundColor: 'white',
        boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
      }}
    >
      <div>
        <h2 style={{ fontSize: 26, fontWeight: 600, color: 'rgb(30,41,59)', margin: 0 }}>
          {media?.heading || 'Media & Resources'}
        </h2>
        <RichText value={media?.intro} />
      </div>
      {items && items.length > 0 && (
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}
        >
          {items.map((item) => (
            <article
              key={item?._key}
              style={{
                borderRadius: 20,
                border: '1px solid rgb(226,232,240)',
                backgroundColor: 'rgb(248,250,252)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                minHeight: 200,
              }}
            >
              {item?.label && (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 999,
                    border: '1px solid rgb(203,213,225)',
                    fontSize: 12,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'rgb(100,116,139)',
                  }}
                >
                  {item.label}
                </span>
              )}
              {item?.title && (
                <h3 style={{ fontSize: 20, fontWeight: 600, color: 'rgb(30,41,59)', margin: 0 }}>{item.title}</h3>
              )}
              {item?.description && (
                <p style={{ margin: 0, color: 'rgb(71,85,105)', lineHeight: 1.6 }}>{item.description}</p>
              )}
              {item?.url && (
                <p style={{ marginTop: 'auto', fontSize: 14, color: 'rgb(37,99,235)' }}>View resource →</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

const meetPastorQuery = `coalesce(
  *[_type == "meetPastor" && _id == $draftId][0],
  *[_type == "meetPastor" && _id == $publishedId][0]
){
  hero{
    title,
    subtitle,
    "image": image.asset->url,
    imageAlt
  },
  biographySection{
    heading,
    body,
    "image": image.asset->url,
    imageAlt
  },
  personalSection{
    heading,
    body,
    "image": image.asset->url,
    imageAlt
  },
  mediaSection{
    heading,
    intro,
    items[]{ _key, title, description, label, url }
  }
}`;

export default function MeetPastorPreviewPane({ document }: Props) {
  const client = useClient({ apiVersion: '2025-08-01', perspective: 'previewDrafts' } as any);
  const [data, setData] = useState<MeetPastorData | null>(null);
  const [loading, setLoading] = useState(true);

  const baseId = useMemo(() => {
    const currentId = document?.displayed?._id;
    if (!currentId) return 'meetPastor';
    return currentId.replace(/^drafts\./, '');
  }, [document?.displayed?._id]);

  useEffect(() => {
    let ignore = false;
    const params = { draftId: `drafts.${baseId}`, publishedId: baseId };

    const fetchData = () => {
      setLoading(true);
      client.fetch<MeetPastorData | null>(meetPastorQuery, params).then((res) => {
        if (!ignore) {
          setData(res);
          setLoading(false);
        }
      });
    };

    fetchData();
    const subscription = client.listen(meetPastorQuery, params, { visibility: 'query' }).subscribe(() => fetchData());

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [client, baseId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'rgb(248,250,252)' }}>
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
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
          {loading && !data && (
            <p style={{ textAlign: 'center', color: 'rgb(100,116,139)' }}>Loading preview…</p>
          )}
          {!loading && !data && (
            <p style={{ textAlign: 'center', color: 'rgb(100,116,139)' }}>
              Start adding content to see a preview of the Meet the Pastor page.
            </p>
          )}
          {data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
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
                  <div style={{ position: 'relative', paddingTop: '45%', backgroundColor: 'rgb(15,23,42)' }}>
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
                <div style={{ padding: data.hero?.image ? 32 : 24 }}>
                  <h1 style={{ fontSize: 34, fontWeight: 700, color: 'rgb(30,41,59)', margin: 0 }}>
                    {data.hero?.title || 'Meet the Pastor'}
                  </h1>
                  {data.hero?.subtitle && (
                    <p style={{ marginTop: 12, fontSize: 18, lineHeight: 1.6, color: 'rgb(71,85,105)' }}>
                      {data.hero.subtitle}
                    </p>
                  )}
                </div>
              </section>

              <SectionPreview section={data.biographySection} fallbackHeading="Bio & Journey" reverse />

              <SectionPreview section={data.personalSection} fallbackHeading="Personal & Family" />

              <MediaPreview media={data.mediaSection} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
