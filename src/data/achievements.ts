/**
 * Achievements data model for showcasing impactful engineering accomplishments.
 * 
 * Sourced from PRD §12 and §116:
 * Instead of generic job descriptions, achievements are structured records highlighting
 * the problem tackled, ownership/responsibility, technical approach, key technologies,
 * company context, domain category, and measurable outcomes.
 * 
 * @NOTE: Full verified data population will be completed in M07.02.
 * Do not invent professional information or metrics.
 */

export interface Achievement {
  /**
   * Unique string identifier for the achievement (e.g., 'network-pricing-apis').
   */
  id: string;

  /**
   * Concise, punchy accomplishment title (e.g., 'Network Pricing APIs Automation').
   */
  title: string;

  /**
   * Engineering domain (e.g., 'Backend Quality', 'Test Automation', 'CI/CD & DevOps', 'Cloud Engineering').
   */
  domain: string;

  /**
   * Company name where the achievement occurred (e.g., 'DP World').
   */
  company: string;

  /**
   * Description of the technical or business problem / challenge.
   */
  problem: string;

  /**
   * Ankit's specific ownership, role, and responsibility.
   */
  responsibility: string;

  /**
   * Technical strategy, architecture, and methodology implemented.
   */
  approach: string;

  /**
   * Array of key tools and technologies utilized (e.g., ['REST Assured', 'Java', 'Docker', 'GitLab CI']).
   */
  technologies: string[];

  /**
   * Measurable impact, reliability improvements, or key deliverables.
   */
  outcome: string;

  /**
   * Optional boolean flag indicating whether this achievement should be featured prominently.
   */
  featured?: boolean;
}

/**
 * Type alias for an array of achievements.
 */
export type AchievementsData = Achievement[];

/**
 * Achievements data list.
 * 
 * WARNING: This is an initial placeholder structure. Verified achievements data
 * based on resume and verified professional experience will be populated in M07.02.
 * 
 * Do not invent professional information.
 */
export const achievementsData: AchievementsData = [];
