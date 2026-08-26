'use client';

import React from 'react';
import { SocialLinks } from './socialLinks';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background/80 backdrop-blur-support border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Social Links */}
          <div className="flex flex-wrap items-center gap-4">
            <SocialLinks className="space-x-4" />
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-muted-foreground">
            &copy; {currentYear} Ankit Nandwani. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};