/**
 * Capability areas data for the professional snapshot section.
 * 
 * This data structure holds the list of capability strings to be displayed
 * as badges in the professional snapshot section below the hero.
 * 
 * @NOTE: All values are placeholders and MUST be verified against the resume
 * before launch. Do not invent professional information.
 */

export interface CapabilityAreasData {
  /**
   * List of capability areas to display as badges (e.g., ["Test Automation", "Performance Engineering", "CI/CD Pipeline Development"])
   * Placeholder array must be replaced with resume-verified capabilities.
   */
  capabilities: string[];
}

/**
 * Placeholder capability areas data.
 * 
 * WARNING: This data contains placeholder values and MUST be replaced
 * with accurate information sourced from the resume before launch.
 * 
 * Do not invent professional information.
 */
export const capabilityAreasData: CapabilityAreasData = {
  capabilities: [], // TO_BE_VERIFIED_AGAINST_RESUME: replace with actual capability array (e.g., ["Test Automation", "Performance Engineering", "CI/CD Pipeline Development", "API Testing", "Mobile Automation"])
};