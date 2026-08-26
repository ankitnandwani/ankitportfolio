import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../design/themeContext.tsx';
import { NavigationBar } from '@/src/components/navigation';
import { Footer } from '@/src/components/footer';
import { PageTransitions } from '@/src/components/layout';
import { CommandPalette } from '@/src/components/command-palette';
import { generateBaseMetadata, generateOrganizationSchema } from '@/src/seo/metadata';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Base metadata for all pages
export const metadata: Metadata = {
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
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
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