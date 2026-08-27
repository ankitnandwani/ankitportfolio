/**
 * Career timeline data model for the interactive career history section.
 * 
 * This data structure holds the professional experience information to be displayed
 * in the career timeline component. Each entry represents a position held at a company.
 * 
 * @NOTE: All values are placeholders and MUST be verified against the resume
 * before launch. Do not invent professional information.
 */

export interface CareerTimelineEntry {
  /**
   * Name of the company where the position was held.
   * Placeholder value must be replaced with resume-verified company name.
   */
  company: string;

  /**
   * Job title or role held at the company.
   * Placeholder value must be replaced with resume-verified role.
   */
  role: string;

  /**
   * Start date of the position (ISO string format recommended, e.g., "2020-01-15").
   * Placeholder value must be replaced with resume-verified start date.
   */
  startDate: string; // ISO date string

  /**
   * End date of the position (ISO string format, or null for current position).
   * Placeholder value must be replaced with resume-verified end date.
   * Use null to indicate current position.
   */
  endDate: string | null;

  /**
   * Professional domain or industry (e.g., "E-commerce", "Finance", "Insurance").
   * Placeholder value must be replaced with resume-verified domain.
   */
  domain: string;

  /**
   * Key responsibilities in this role.
   * Placeholder array must be replaced with resume-verified responsibilities.
   */
  responsibilities: string[];

  /**
   * Major technologies used in this role.
   * Placeholder array must be replaced with resume-verified technologies.
   */
  technologies: string[];

  /**
   * Notable projects or achievements in this role.
   * Placeholder array must be replaced with resume-verified notable projects.
   */
  notableProjects: string[];
}

/**
 * Placeholder career timeline data.
 * 
 * WARNING: This data contains placeholder values and MUST be replaced
 * with accurate information sourced from the resume before launch.
 * 
 * Data should be ordered chronologically (most recent first).
 * 
 * Do not invent professional information.
 */
export const careerTimelineData: CareerTimelineEntry[] = [
  {
    company: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "Google"
    role: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "Senior Software Engineer"
    startDate: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "2020-06-01"
    endDate: null, // null for current position, or e.g., "2023-05-31"
    domain: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "Technology"
    responsibilities: [], // TO_BE_VERIFIED_AGAINST_RESUME: replace with actual responsibilities array
    technologies: [], // TO_BE_VERIFIED_AGAINST_RESUME: replace with actual technologies array
    notableProjects: [], // TO_BE_VERIFIED_AGAINST_RESUME: replace with actual notable projects array
  },
  // Additional entries can be added here following the same pattern
  // Ensure all data is verified against the resume before launch
];

/**
 * Type alias for the career timeline data array.
 */
export type CareerTimelineData = CareerTimelineEntry[];