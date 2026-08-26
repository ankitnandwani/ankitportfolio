import { siteConfig } from '@/src/siteConfig';

/**
 * Generate base metadata tags that are common across all pages
 */
export function generateBaseMetadata(additionalTitle?: string, additionalDescription?: string) {
  const title = additionalTitle 
    ? `${additionalTitle} | ${siteConfig.name}` 
    : siteConfig.name;
  
  const description = additionalDescription || siteConfig.description;

  return {
    title,
    description,
    // Canonical URL
    alternates: {
      canonical: siteConfig.url,
    },
    // Open Graph tags
    openGraph: {
      title,
      description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} - ${additionalTitle || ''}`.trim(),
        },
      ],
      type: 'website',
      locale: 'en_US',
    },
    // Twitter Card tags
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@ankitnandwani', // Assuming Twitter handle
      images: [siteConfig.ogImage],
    },
    // JSON-LD structured data
    // This will be overridden by route-specific structured data if needed
    // We'll add it separately in the layout or via generateStructuredData function
  };
}

/**
 * Generate JSON-LD structured data for Organization schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`, // Assuming logo exists
    sameAs: [
      siteConfig.author.email ? `mailto:${siteConfig.author.email}` : '',
      'https://linkedin.com/in/ankitnandwani',
      'https://github.com/ankitnaadwani',
      'https://x.com/ankitnandwani',
      'https://instagram.com/ankitnandwani',
      'https://medium.com/@ankitnandwani',
    ].filter(Boolean),
  };
}

/**
 * Generate JSON-LD structured data for Person schema
 */
export function generatePersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.author.name,
    url: siteConfig.url,
    sameAs: [
      'https://linkedin.com/in/ankitnandwani',
      'https://github.com/ankitnaadwani',
      'https://x.com/ankitnandwani',
      'https://instagram.com/ankitnandwani',
      'https://medium.com/@ankitnandwani',
    ].filter(Boolean),
  };
}