/**
 * Skills data model for the resume section.
 * 
 * This data structure holds the technical skills information to be displayed
 * in the resume section.
 * 
 * @NOTE: All values are placeholders and MUST be verified against the resume
 * before launch. Do not invent professional information.
 */

export interface SkillsData {
  /**
   * List of technical skills (e.g., ["Java", "Selenium", "REST Assured", "Python", "SQL", "Kafka", "AWS", "Azure", "Docker", "Jenkins", "Git"]).
   * Placeholder array must be replaced with resume-verified skills.
   */
  technicalSkills: string[];

  /**
   * Optional categorization of skills by domain.
   * Placeholder object must be replaced with resume-verified categorization.
   */
  categorizedSkills?: {
    /**
     * Quality Engineering skills (e.g., ["Selenium", "Playwright", "Appium", "TestNG", "Cucumber", "BDD", "Contract Testing", "API Automation"]).
     */
    qualityEngineering?: string[];

    /**
     * Backend/API skills (e.g., ["Java", "REST APIs", "RestAssured", "Pactum", "Python", "SQL", "Kafka"]).
     */
    backendApi?: string[];

    /**
     * CI/CD skills (e.g., ["Azure DevOps", "GitHub Actions", "Jenkins", "Bamboo", "Maven", "Docker"]).
     */
    ciCd?: string[];

    /**
     * Cloud/Data skills (e.g., ["AWS", "Azure", "Snowflake", "Redshift", "Athena"]).
     */
    cloudData?: string[];

    /**
     * AI / Modern Engineering skills (e.g., ["LLMs", "RAG", "AI-assisted development", "Prompt engineering", "AI application architecture"]).
     */
    aiModernEngineering?: string[];
  };
}

/**
 * Placeholder skills data.
 * 
 * WARNING: This data contains placeholder values and MUST be replaced
 * with accurate information sourced from the resume before launch.
 * 
 * Do not invent professional information.
 */
export const skillsData: SkillsData = {
  technicalSkills: [], // TO_BE_VERIFIED_AGAINST_RESUME: replace with actual technical skills array
  categorizedSkills: {
    qualityEngineering: [], // TO_BE_VERIFIED_AGAINST_RESUME: replace with actual quality engineering skills
    backendApi: [], // TO_BE_VERIFIED_AGAINST_RESUME: replace with actual backend/API skills
    ciCd: [], // TO_BE_VERIFIED_AGAINST_RESUME: replace with actual CI/CD skills
    cloudData: [], // TO_BE_VERIFIED_AGAINST_RESUME: replace with actual cloud/data skills
    aiModernEngineering: [], // TO_BE_VERIFIED_AGAINST_RESUME: replace with actual AI/modern engineering skills
  },
};

/**
 * Type alias for the skills data object.
 */
export type SkillsDataType = SkillsData;