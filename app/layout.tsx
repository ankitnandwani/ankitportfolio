import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Geist } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../design/themeContext.tsx';
import { NavigationBar } from '@/src/components/navigation';
import { Footer } from '@/src/components/footer';
import { PageTransitions } from '@/src/components/layout';
import { CommandPalette } from '@/src/components/command-palette';
import { ChatWrapper } from '@/src/components/aiChat/ChatWrapper';
import { generateBaseMetadata, generateOrganizationSchema } from '@/src/seo/metadata';
import { getSiteUrl } from '@/src/siteConfig';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Base metadata for all pages
export const metadata: Metadata = {
  // The base of the metadata is the address of the site, so that every
  // address of the site that is not written out is resolved against it.
  metadataBase: getSiteUrl(),
  ...generateBaseMetadata(),
  // Add organization structured data
  // Note: Next.js metadata API doesn't directly support JSON-LD in metadata object
  // We'll add it via a custom component or in the layout JSON-LD script tag
  // For now, we'll rely on adding structured data via a component
  // Alternative: we can use the `other` field in metadata to add custom tags
  // But let's add structured data via a component in the layout
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ThemeProvider>
      <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
        <body className="flex flex-col min-h-screen">
          <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2">
            Skip to main content
          </a>
          <NavigationBar />
          <main id="content" className="flex-grow-1">
            <PageTransitions>{children}</PageTransitions>
          </main>
          <Footer />
          <CommandPalette className="pointer-events-none" />
          <ChatWrapper />
          {/* JSON-LD Structured Data for Organization */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateOrganizationSchema()),
            }}
          />
        </body>
      </html>
    </ThemeProvider>
  );
}