/**
 * Career timeline data model for the interactive career history section.
 * 
 * This data structure holds the professional experience information to be displayed
 * in the career timeline component. Each entry represents a position held at a company.
 * 
 * @NOTE: Data sourced from PRD.md career timeline example (which reflects the resume).
 * Month/day values in dates are placeholders and should be verified against the resume.
 * Responsibilities, technologies, and notable projects arrays are empty and need to be filled
 * with verified information from the resume.
 * 
 * Do not invent professional information.
 */

export interface CareerTimelineEntry {
  /**
   * Name of the company where the position was held.
   * Value verified from PRD.md career timeline example.
   */
  company: string;

  /**
   * Job title or role held at the company.
   * Value verified from PRD.md career timeline example.
   */
  role: string;

  /**
   * Start date of the position (ISO string format, e.g., "2021-01-01").
   * Month/day values are placeholders and need verification against resume.
   */
  startDate: string; // ISO date string

  /**
   * End date of the position (ISO string format, or null for current position).
   * Month/day values are placeholders and need verification against resume.
   * Use null to indicate current position.
   */
  endDate: string | null;

  /**
   * Professional domain or industry (e.g., "Logistics", "Technology").
   * Placeholder array - needs verification against resume.
   */
  domain: string;

  /**
   * Key responsibilities in this role.
   * Placeholder array - needs verification against resume.
   */
  responsibilities: string[];

  /**
   * Major technologies used in this role.
   * Placeholder array - needs verification against resume.
   */
  technologies: string[];

  /**
   * Notable projects or achievements in this role.
   * Placeholder array - needs verification against resume.
   */
  notableProjects: string[];
}

/**
 * Career timeline data sourced from PRD.md career timeline example.
 * 
 * Data should be ordered chronologically (most recent first).
 * 
 * Month/day values in dates are placeholders and need verification against resume.
 * Responsibilities, technologies, and notable projects arrays are empty and need to be filled
 * with verified information from the resume.
 * 
 * Do not invent professional information.
 */
export const careerTimelineData: CareerTimelineEntry[] = [
  {
    company: 'DP World',
    role: 'Senior SDET',
    startDate: '2021-01-01', // TODO: Verify month/day against resume
    endDate: null, // Present position
    domain: 'Logistics', // TODO: Verify domain against resume
    responsibilities: [], // TODO: Fill with verified responsibilities from resume
    technologies: [], // TODO: Fill with verified technologies from resume
    notableProjects: [], // TODO: Fill with verified notable projects from resume
  },
  {
    company: 'Persistent Systems',
    role: 'Senior SDET',
    startDate: '2020-01-01', // TODO: Verify month/day against resume
    endDate: '2021-01-01', // TODO: Verify month/day against resume
    domain: 'Information Technology', // TODO: Verify domain against resume
    responsibilities: [], // TODO: Fill with verified responsibilities from resume
    technologies: [], // TODO: Fill with verified technologies from resume
    notableProjects: [], // TODO: Fill with verified notable projects from resume
  },
  {
    company: 'Centric Consulting',
    role: 'QA Consultant',
    startDate: '2017-01-01', // TODO: Verify month/day against resume
    endDate: '2020-01-01', // TODO: Verify month/day against resume
    domain: 'Consulting', // TODO: Verify domain against resume
    responsibilities: [], // TODO: Fill with verified responsibilities from resume
    technologies: [], // TODO: Fill with verified technologies from resume
    notableProjects: [], // TODO: Fill with verified notable projects from resume
  },
  {
    company: 'Fareportal',
    role: 'SDET',
    startDate: '2016-01-01', // TODO: Verify month/day against resume
    endDate: '2017-01-01', // TODO: Verify month/day against resume
    domain: 'Travel Technology', // TODO: Verify domain against resume
    responsibilities: [], // TODO: Fill with verified responsibilities from resume
    technologies: [], // TODO: Fill with verified technologies from resume
    notableProjects: [], // TODO: Fill with verified notable projects from resume
  },
  {
    company: 'United Health Group',
    role: 'Software Development Engineer in Test',
    startDate: '2015-01-01', // TODO: Verify month/day against resume
    endDate: '2016-01-01', // TODO: Verify month/day against resume
    domain: 'Healthcare', // TODO: Verify domain against resume
    responsibilities: [], // TODO: Fill with verified responsibilities from resume
    technologies: [], // TODO: Fill with verified technologies from resume
    notableProjects: [], // TODO: Fill with verified notable projects from resume
  },
  {
    company: 'Aon Hewitt',
    role: 'Programmer Analyst',
    startDate: '2013-01-01', // TODO: Verify month/day against resume
    endDate: '2015-01-01', // TODO: Verify month/day against resume
    domain: 'Insurance', // TODO: Verify domain against resume
    responsibilities: [], // TODO: Fill with verified responsibilities from resume
    technologies: [], // TODO: Fill with verified technologies from resume
    notableProjects: [], // TODO: Fill with verified notable projects from resume
  },
];

/**
 * Type alias for the career timeline data array.
 */
export type CareerTimelineData = CareerTimelineEntry[];