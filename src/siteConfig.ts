/**
 * The address of the site that is used when the one from the environment
 * cannot be read.
 */
const DEFAULT_SITE_URL = "https://ankitnandwani.com";

export const siteConfig = {
  name: "Ankit Nandwani",
  description: "Senior SDET / Automation Engineer Portfolio & AI Recruiter Assistant",
  url: process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL,
  author: {
    name: "Ankit Nandwani",
    email: "contact@ankitnandwani.com", // Using a generic contact email, not personal phone
  },
  linkedin: "https://linkedin.com/in/ankitnandwani",
  github: "https://github.com/ankitnaadwani",
  keywords: [
    "Senior SDET",
    "Automation Engineer",
    "Portfolio",
    "AI Assistant",
    "Ankit Nandwani",
    "Software Development",
    "Test Automation",
    "CI/CD",
    "DevOps",
  ],
  // The picture of the social networks. The address is not in it, so that it
  // is resolved against the address of the site, whatever it is.
  defaultOgImage: "/og-image.png",
};

/**
 * The address of the site, as an address that the framework can build on.
 *
 * The address comes from the environment, and while a project is still being
 * set up the value there can be a placeholder such as `your_site_url`, which
 * is not an address of the web at all. A value that cannot be read as an
 * address falls back to the known address of the site, the same way the host
 * does, so that a setting that has not been filled in never makes the build
 * fail.
 *
 * @param url The address to read.
 * @returns The address of the site, as a URL.
 */
export function getSiteUrl(url: string = siteConfig.url): URL {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('The address of the site is not an address of the web.');
    }

    return parsed;
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

/**
 * The host of the site, without the scheme and without the path.
 *
 * The address of the site comes from the environment, and while a project is
 * still being set up the value there can be a placeholder such as
 * `your_site_url`. A value that cannot be read as an address has no host,
 * so the known address of the site is used instead. A setting that has not
 * been filled in never makes the code fail.
 *
 * @param url The address to read the host from. The address of the site is
 *   used when this is not given.
 * @returns The host of the site, for example `ankitnandwani.com`.
 */
export function getSiteHost(url: string = siteConfig.url): string {
  try {
    return new URL(url).hostname;
  } catch {
    return new URL(DEFAULT_SITE_URL).hostname;
  }
}
