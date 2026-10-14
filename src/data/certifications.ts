/**
 * Certifications data model for the resume section.
 * 
 * This data structure holds the certification information to be displayed
 * in the resume section.
 * 
 * @NOTE: All values are placeholders and MUST be verified against the resume
 * before launch. Do not invent professional information.
 * 
 * Current resume-listed certifications should be represented only after confirming they remain current:
 * - Oracle Certified Associate — Java SE 7 Programmer
 * - AWS Certified Solutions Architect – Associate
 */

export interface CertificationEntry {
  /**
   * Name of the certification (e.g., "Oracle Certified Associate — Java SE 7 Programmer").
   */
  name: string;

  /**
   * Issuing organization (e.g., "Oracle Corporation").
   */
  issuer: string;

  /**
   * Date of certification (ISO string format, e.g., "2015-06-01").
   * Month/day values are placeholders and need verification against resume.
   * Alternatively, could be a year string like "2015".
   */
  date: string; // ISO date string or year string

  /**
   * Verification URL (optional).
   * Should be a valid URL to verify the certification.
   * Never fabricate verification links.
   */
  verificationUrl?: string;

  /**
   * Additional description or notes about the certification.
   * Optional field.
   */
  description?: string;
}

/**
 * Placeholder certifications data.
 * 
 * WARNING: This data contains placeholder values and MUST be replaced
 * with accurate information sourced from the resume before launch.
 * 
 * Do not invent professional information.
 * 
 * Current resume-listed certifications should be represented only after confirming they remain current:
 * - Oracle Certified Associate — Java SE 7 Programmer
 * - AWS Certified Solutions Architect – Associate
 */
export const certificationsData: CertificationEntry[] = [
  {
    name: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "Oracle Certified Associate — Java SE 7 Programmer"
    issuer: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "Oracle Corporation"
    date: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "2015-06-01" or "2015"
    verificationUrl: 'TO_BE_VERIFIED_AGAINST_RESUME', // Optional verification URL
    description: 'TO_BE_VERIFIED_AGAINST_RESUME', // Optional description
  },
  {
    name: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "AWS Certified Solutions Architect – Associate"
    issuer: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "Amazon Web Services"
    date: 'TO_BE_VERIFIED_AGAINST_RESUME', // e.g., "2016-03-01" or "2016"
    verificationUrl: 'TO_BE_VERIFIED_AGAINST_RESUME', // Optional verification URL
    description: 'TO_BE_VERIFIED_AGAINST_RESUME', // Optional description
  },
];

/**
 * Type alias for the certifications data array.
 */
export type CertificationsData = CertificationEntry[];