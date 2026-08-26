import { generateBaseMetadata } from '@/src/seo/metadata';
import DesignSystemShowcaseClient from './page-client';

export const metadata = {
  ...generateBaseMetadata('Design System Showcase', 'Visual reference for design tokens, components, themes, and motion presets'),
  // Override Open Graph image if needed
  openGraph: {
    ...generateBaseMetadata('Design System Showcase', 'Visual reference for design tokens, components, themes, and motion presets').openGraph,
  },
  twitter: {
    ...generateBaseMetadata('Design System Showcase', 'Visual reference for design tokens, components, themes, and motion presets').twitter,
  },
};

export default function DesignSystemShowcase() {
  return (
    <DesignSystemShowcaseClient />
  );
}