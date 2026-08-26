'use client';

import { useTheme } from '@/design/themeContext';

import { motionVariants } from '@/design/motion';
import { motion } from 'framer-motion';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';

export default function DesignSystemShowcase() {
  const { theme, toggleTheme, getThemeTokens } = useTheme();
  const currentTokens = getThemeTokens();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 p-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Ankit Design System Showcase</h1>
        <p className="text-lg text-muted-foreground">
          A visual reference for design tokens, components, themes, and motion presets.
        </p>
      </header>

      <div className="space-y-12">
        {/* Tokens Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Design Tokens</h2>
          <div className="grid gap-8">
            {/* Colors */}
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Colors</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(currentTokens.colors).map(([name, value]) => (
                  <div key={name} className="flex flex-col items-center p-4 bg-surface/50 rounded-lg">
                    <div className="w-12 h-12 mb-2" style={{ backgroundColor: value }}></div>
                    <span className="text-xs text-muted-foreground">{name}</span>
                    <span className="text-xs break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spacing */}
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Spacing</h3>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(currentTokens.spacing).map(([name, value]) => (
                  <div key={name} className="flex flex-col items-center">
                    <div className={`h-${value/4} w-${value/4} bg-primary rounded`}></div>
                    <span className="text-xs text-muted-foreground mt-1">{name}: {value}px</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Typography</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="font-medium">Font Family:</span>
                  <span className="font-mono">{currentTokens.typography.fontFamily}</span>
                </div>
                {['xxs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'].map((name) => {
                  const value = currentTokens.typography.fontSize[name as keyof typeof currentTokens.typography.fontSize];
                  const textSize = name === 'xxs' ? 'xs' : name;
                  return (
                    <div key={name} className="flex items-start space-x-4">
                      <div className={`text-${textSize}`} style={{ 
  fontWeight: currentTokens.typography.fontWeight.regular,
  lineHeight: currentTokens.typography.lineHeight.normal,
  letterSpacing: currentTokens.typography.letterTracking.normal
}}>
                        The quick brown fox jumps over the lazy dog
                      </div>
                      <span className="text-xs text-muted-foreground">{name}: {value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Radius */}
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Radius</h3>
              <div className="grid grid-cols-6 gap-4">
                {Object.entries(currentTokens.radius).map(([name, value]) => (
                  <div key={name} className="flex flex-col items-center">
                    <div className={`w-12 h-12 bg-primary rounded-${name === 'none' ? 'none' : name === 'sm' ? 'sm' : name === 'md' ? 'md' : name === 'lg' ? 'lg' : name === 'xl' ? '3xl' : 'full'}`}></div>
                    <span className="text-xs text-muted-foreground mt-1">{name}: {value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Elevation */}
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Elevation (Shadows)</h3>
              <div className="space-y-4">
                {Object.entries(currentTokens.elevation).map(([name, value]) => (
                  <div key={name} className="flex items-center space-x-4">
                    <div className={`w-24 h-8 bg-surface/50 rounded-md`} style={{ boxShadow: value }}>
                      <span className="text-xs text-muted-foreground">{name}</span>
                      <span className="flex-1 text-xs break-all">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Breakpoints */}
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Breakpoints</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(currentTokens.breakpoints).map(([name, value]) => (
                  <div key={name} className="flex flex-col items-center">
                    <span className="px-3 py-1 bg-primary/20 rounded text-xs">{name}: {value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Components Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Components</h2>
          <div className="grid gap-8">
            {/* Button */}
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Button</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" size="md">Primary</Button>
                <Button variant="secondary" size="md">Secondary</Button>
                <Button variant="accent" size="md">Accent</Button>
                <Button variant="primary" size="xs">XS</Button>
                <Button variant="primary" size="sm">SM</Button>
                <Button variant="primary" size="lg">LG</Button>
                <Button variant="primary" size="xl">XL</Button>
              </div>
            </div>

            {/* Card */}
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Card</h3>
              <div className="grid grid-cols-2 gap-6">
                <Card bgColor="surface" size="md" radius="md">
                  <h4 className="font-semibold mb-2">Card Title</h4>
                  <p className="text-muted-foreground">
                    This is a sample card demonstrating the design system&apos;s Card component.
                  </p>
                </Card>
                <Card bgColor="primary" size="lg" radius="lg" className="text-white">
                  <h4 className="font-semibold mb-2">Primary Card</h4>
                  <p className="text-white/90">
                    Card with primary background and larger size.
                  </p>
                </Card>
              </div>
            </div>

            {/* Badge */}
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Badge</h3>
              <div className="flex flex-wrap gap-2">
                {Object.keys(currentTokens.colors).map((color) => (
                  <Badge key={color} variant={color as keyof typeof currentTokens.colors} size="md">
                    {color}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Themes Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Themes</h2>
          <div className="space-y-6">
            <p className="text-lg">
              Current theme: <span className="font-semibold capitalize">{theme}</span>
            </p>
            <Button variant="secondary" size="md" onClick={toggleTheme}>
              Toggle Theme
            </Button>
          </div>
        </section>

        {/* Motion Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Motion Presets</h2>
          <div className="space-y-6">
            <motion.div
              whileTap={motionVariants.scaleTap}
              initial={motionVariants.fadeIn.initial}
              animate={motionVariants.fadeIn.animate}
              exit={motionVariants.fadeIn.exit}
              className="w-48 h-48 bg-primary/20 flex items-center justify-center rounded-lg transition-all duration-500"
            >
              <motion.button
                whileTap={motionVariants.scaleTap}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 transition-colors"
              >
                Tap Me
              </motion.button>
            </motion.div>
            <p className="text-sm text-muted-foreground">
              Demonstrates scale tap and fade-in animations using Framer Motion variants.
            </p>
          </div>
        </section>
      </div>

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        Design System Showcase • Built with NeoPOP, Tailwind CSS, and Framer Motion
      </footer>
    </div>
  );
}