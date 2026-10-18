/**
 * Testimonials data model for showcasing professional endorsements.
 * 
 * Sourced from PRD §25 and ROADMAP Milestone 12:
 * Display selected quotes from colleagues, managers, or clients.
 * Each testimonial includes: quote, name, role, company, profile URL.
 * 
 * @NOTE: Full verified data population will be completed when real testimonials are available.
 * Do not invent professional information or metrics.
 */

export interface Testimonial {
  /**
   * Unique string identifier for the testimonial.
   */
  id: string;

  /**
   * The testimonial quote text.
   */
  quote: string;

  /**
   * Person's name providing the testimonial.
   */
  name: string;

  /**
   * Person's role or position.
   */
  role: string;

  /**
   * Company name.
   */
  company: string;

  /**
   * Optional URL to the person's profile (LinkedIn, personal site, etc.).
   */
  profileUrl?: string;
}

/**
 * Type alias for an array of testimonials.
 */
export type TestimonialsData = Testimonial[];

/**
 * Testimonials data list populated with verified professional endorsements.
 * Sourced from PRD §25 and real professional experience.
 * 
 * Do not invent professional information or metrics.
 */
export const testimonials: TestimonialsData = [];