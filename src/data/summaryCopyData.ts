/**
 * Summary copy data for the professional snapshot section.
 * 
 * This data structure holds the summary text to be displayed
 * in the professional snapshot section below the hero.
 * 
 * @NOTE: All values are placeholders and MUST be verified against the resume
 * before launch. Do not invent professional information.
 */

export interface SummaryCopyData {
  /**
   * Professional summary text (e.g., "Senior SDET / Automation Engineer with 10+ years of experience...")
   * Placeholder value must be replaced with resume-verified summary.
   */
  summary: string;
}

/**
 * Placeholder summary copy data.
 * 
 * WARNING: This data contains placeholder values and MUST be replaced
 * with accurate information sourced from the resume before launch.
 * 
 * Do not invent professional information.
 */
export const summaryCopyData: SummaryCopyData = {
  summary: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "Senior SDET / Automation Engineer with 10+ years of experience designing and implementing scalable automation frameworks across API, UI, and mobile domains."
};