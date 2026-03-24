import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Sahla DZ';
const SITE_URL = 'https://arz-sahla.pages.dev';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const DEFAULT_DESCRIPTION =
  'متجركم الأول للإلكترونيات والإكسسوارات في الجزائر — أسعار تنافسية، جودة عالية، وتوصيل سريع لجميع ولايات الجزائر.';

interface SEOMetaProps {
  /** Page title — will be appended with " | Sahla DZ" */
  title?: string;
  description?: string;
  /** Absolute URL to OG share image (1200×630 recommended) */
  image?: string;
  /** Canonical URL for this page */
  url?: string;
  /** Set to "article" for product/blog pages */
  ogType?: 'website' | 'article' | 'product';
  /** Extra JSON-LD schemas (e.g. Product, BreadcrumbList) */
  schemas?: object[];
}

export const SEOMeta: React.FC<SEOMetaProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_OG_IMAGE,
  url = typeof window !== 'undefined' ? window.location.href : SITE_URL,
  ogType = 'website',
  schemas = [],
}) => {
  // Build full page title
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — تسوق بسهولة في الجزائر`;

  // Ensure image is absolute
  const absoluteImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  // Organization JSON-LD (always present)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Arabic', 'French'],
    },
  };

  // WebSite JSON-LD with SearchAction (enables Google Sitelinks Search Box)
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const allSchemas = [organizationSchema, websiteSchema, ...schemas];

  return (
    <Helmet>
      {/* ── Primary ── */}
      <html lang="ar" dir="rtl" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* ── Open Graph ── */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content="ar_DZ" />

      {/* ── Twitter Cards ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />

      {/* ── JSON-LD Structured Data ── */}
      {allSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};
