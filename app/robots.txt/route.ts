import { siteConfig } from '@/src/siteConfig';

export const dynamic = 'force-static';

export async function GET() {
  return new Response(
    `User-agent: *
Allow: /

Sitemap: ${siteConfig.url}/sitemap.xml`,
    {
      headers: {
        'Content-Type': 'text/plain',
      },
    }
  );
}
