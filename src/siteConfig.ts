export const siteConfig = {
  name: "Ankit Nandwani",
  description: "Senior SDET / Automation Engineer Portfolio & AI Recruiter Assistant",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://ankitnandwani.com",
  author: {
    name: "Ankit Nandwani",
    email: "contact@ankitnandwani.com", // Using a generic contact email, not personal phone
  },
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
  // Open Graph / Twitter card image
  ogImage: `${process.env.NEXT_PUBLIC_SITE_URL || "https://ankitnandwani.com"}/og-image.png`,
  // Default social sharing image
  defaultOgImage: "/og-image.png",
};