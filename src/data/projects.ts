/**
 * Project data model for showcasing engineering projects.
 * 
 * Sourced from PRD §16 and §117:
 * The Projects section showcases engineering projects rather than simple technology lists.
 * Each project needs a well-defined structure capturing the name, value proposition,
 * category, motivation, learning outcomes, architectural highlights, technology stack,
 * and external links (GitHub, live demo).
 * 
 * @NOTE: Full verified data population will be completed in M08.02.
 * Do not invent professional information or metrics.
 */

export interface Project {
  /**
   * Unique string identifier for the project (e.g., 'ccgeek').
   */
  id: string;

  /**
   * Concise project name (e.g., "CCGeek").
   */
  name: string;

  /**
   * One-line description of what the project does or its primary benefit.
   */
  valueProposition: string;

  /**
   * Project category from the allowed set.
   */
  category: ProjectCategory;

  /**
   * Array of key tools/technologies utilized (e.g., ["Microsoft Graph", "PostgreSQL", "React", "Node.js"]).
   */
  technologies: string[];

  /**
   * Motivation and context for why the project was created.
   */
  whyBuilt: string;

  /**
   * Key skills, insights, or experiences gained from building the project.
   */
  whatLearned: string;

  /**
   * High-level architectural overview or key technical decisions.
   */
  architecture: string;

  /**
   * URL to the GitHub repository (optional if not applicable).
   */
  githubUrl?: string;

  /**
   * URL to live demo or deployment (optional if not applicable).
   */
  demoUrl?: string;

  /**
   * Optional boolean flag indicating if this project should be featured prominently on homepage.
   */
  featured?: boolean;
}

/**
 * Union type for valid project categories.
 */
export type ProjectCategory = 
  | "Professional"
  | "Personal Engineering"
  | "Engineering Lab"
  | "Finance"
  | "AI";

/**
 * Type alias for an array of projects.
 */
export type ProjectData = Project[];

/**
 * Placeholder project data list.
 * 
 * @NOTE: This data contains placeholder values and MUST be replaced
 * with accurate information sourced from verified projects before launch.
 * 
 * Do not invent professional information or metrics.
 */
export const projectsData: ProjectData = [
  // TODO: Populate with verified project data in M08.02
  // Example structure (to be replaced with actual data):
  // {
  //   id: 'example-project',
  //   name: 'Example Project',
  //   valueProposition: 'A brief description of what the project does',
  //   category: 'Personal Engineering',
  //   technologies: ['Technology1', 'Technology2', 'Technology3'],
  //   whyBuilt: 'Motivation and context for why the project was created',
  //   whatLearned: 'Key skills, insights, or experiences gained',
  //   architecture: 'High-level architectural overview or key technical decisions',
  //   githubUrl: 'https://github.com/username/repo',
  //   demoUrl: 'https://example.com/demo',
  //   featured: false,
  // },
];