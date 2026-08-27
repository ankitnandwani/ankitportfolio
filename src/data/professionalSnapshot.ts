/**
 * Professional snapshot data model for the homepage metric cards.
 * 
 * This data structure holds the professional information to be displayed
 * in the professional snapshot section below the hero.
 * 
 * @NOTE: All values are placeholders and MUST be verified against the resume
 * before launch. Do not invent professional information.
 */

export interface ProfessionalSnapshotData {
  /**
   * Years of engineering experience (e.g., 10 for display as "10+ YEARS")
   * Placeholder value must be replaced with resume-verified number.
   */
  yearsExperience: number;

  /**
   * List of professional domains (e.g., ["E-commerce", "Finance", "Insurance", "Logistics"])
   * Placeholder array must be replaced with resume-verified domains.
   */
  domains: string[];

  /**
   * Automation experience areas (e.g., "API + UI + Mobile")
   * Placeholder value must be replaced with resume-verified experience.
   */
  automationExperience: string;

  /**
   * Cloud and CI/CD practices (e.g., "Cloud + CI/CD")
   * Placeholder value must be replaced with resume-verified practices.
   */
  cloudCIDPractices: string;
}

/**
 * Placeholder professional snapshot data.
 * 
 * WARNING: This data contains placeholder values and MUST be replaced
 * with accurate information sourced from the resume before launch.
 * 
 * Do not invent professional information.
 */
export const professionalSnapshotData: ProfessionalSnapshotData = {
  yearsExperience: 0, // TO_BE_VERIFIED_AGAINST_RESUME: replace with actual years of engineering experience
  domains: [], // TO_BE_VERIFIED_AGAINST_RESUME: replace with actual domain array (e.g., ["E-commerce", "Finance", "Insurance", "Logistics"])
  automationExperience: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "API + UI + Mobile"
  cloudCIDPractices: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "Cloud + CI/CD"
};