import { siteConfig } from '@/src/siteConfig';
import { NAVIGATION_ITEMS } from '@/src/data/navigationItems';

export const dynamic = 'force-static';

export async function GET() {
  const baseUrl = siteConfig.url;
  const navRoutes = NAVIGATION_ITEMS.map(item => item.href);
  const additionalRoutes = ['/design-system'];
  const allRoutes = [...new Set([...navRoutes, ...additionalRoutes])];
  const entries = allRoutes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'monthly',
    priority: route === '/' ? 1.0 : 0.8,
  }));
  const xml = generateSitemapXml(entries);
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

function generateSitemapXml(entries: { url: string; lastModified: string; changeFrequency: string; priority: number }[]): string {
  const urls = entries
    .map(
      ({ url, lastModified, changeFrequency, priority }) =>
        `<url><loc>${url}</loc><lastmod>${lastModified}</lastmod><changefreq>${changeFrequency}</changefreq><priority>${priority}</priority></url>`
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}
