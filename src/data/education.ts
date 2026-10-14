/**
 * Education data model for the resume section.
 * 
 * This data structure holds the educational background information to be displayed
 * in the resume section.
 * 
 * @NOTE: All values are placeholders and MUST be verified against the resume
 * before launch. Do not invent professional information.
 */

export interface EducationEntry {
  /**
   * Name of the educational institution (e.g., "Maharshi Dayanand University").
   */
  institution: string;

  /**
   * Degree earned (e.g., "Bachelor of Technology").
   */
  degree: string;

  /**
   * Field of study or major (e.g., "Information Technology").
   */
  fieldOfStudy: string;

  /**
   * Start date of the education (ISO string format, e.g., "2009-01-01").
   * Month/day values are placeholders and need verification against resume.
   */
  startDate: string; // ISO date string

  /**
   * End date of the education (ISO string format).
   * Month/day values are placeholders and need verification against resume.
   */
  endDate: string; // ISO date string

  /**
   * Location of the institution (e.g., "Rohtak, Haryana, India").
   * Optional field.
   */
  location?: string;

  /**
   * Additional description or notable achievements during education.
   * Optional field.
   */
  description?: string;
}

/**
 * Placeholder education data.
 * 
 * WARNING: This data contains placeholder values and MUST be replaced
 * with accurate information sourced from the resume before launch.
 * 
 * Do not invent professional information.
 */
export const educationData: EducationEntry[] = [
  {
    institution: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "Maharshi Dayanand University"
    degree: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "Bachelor of Technology"
    fieldOfStudy: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "Information Technology"
    startDate: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "2009-01-01"
    endDate: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "2013-01-01"
    location: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "Rohtak, Haryana, India"
    description: 'TO_BE_VERIFIED_AGAINST_RESUME', // Optional description
  },
];

/**
 * Type alias for the education data array.
 */
export type EducationData = EducationEntry[];