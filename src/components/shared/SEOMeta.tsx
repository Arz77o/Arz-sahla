import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOMetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export const SEOMeta: React.FC<SEOMetaProps> = ({
  title = 'Sahla DZ',
  description = 'متجركم الأول للإلكترونيات والإكسسوارات في الجزائر — جودة، سرعة، وأمان في التوصيل.',
  image = '/og-image.jpg',
  url = typeof window !== 'undefined' ? window.location.href : '',
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <link rel="canonical" href={url} />
    </Helmet>
  );
};
