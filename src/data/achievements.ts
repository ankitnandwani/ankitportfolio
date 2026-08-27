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
 * Achievements data list populated with verified professional experience.
 * Sourced from PRD §12, §13, and verified engineering experience across companies.
 * 
 * Do not invent professional information or metrics.
 */
export const achievementsData: AchievementsData = [
  {
    id: 'network-pricing-apis',
    title: 'Network Pricing APIs Automation',
    domain: 'Backend Quality',
    company: 'DP World',
    problem: 'High-throughput freight rate services and logistics pricing APIs required comprehensive automated validation to prevent pricing discrepancies and latency regressions in mission-critical logistics operations.',
    responsibility: 'Owned backend quality and test architecture for core API services responsible for providing international freight rates.',
    approach: 'Designed and built modular REST API test automation suites integrated into CI/CD pipelines with containerized execution and automated regression verification.',
    technologies: ['REST Assured', 'Java', 'Docker', 'GitLab CI', 'Kafka', 'PostgreSQL'],
    outcome: 'Ensured continuous quality validation and rapid feedback cycles for mission-critical freight pricing services without manual testing bottlenecks.',
    featured: true,
  },
  {
    id: 'enterprise-cloud-framework',
    title: 'Enterprise Cloud Test Framework Engineering',
    domain: 'Test Automation Architecture',
    company: 'Persistent Systems',
    problem: 'Disconnected automation tools and manual test execution slowed down release cycles and caused inconsistent test reporting across distributed enterprise services.',
    responsibility: 'Led test framework design and test automation strategy for enterprise backend services and integration layers.',
    approach: 'Implemented scalable test automation solutions utilizing BDD principles, API test suites, and parallel execution pipelines for distributed cloud services.',
    technologies: ['Java', 'TestNG', 'Cucumber', 'REST APIs', 'Jenkins', 'Maven'],
    outcome: 'Streamlined test execution time and provided standardized, automated test reporting across multi-tier enterprise systems.',
    featured: true,
  },
  {
    id: 'multi-platform-cicd-modernization',
    title: 'Multi-Platform Automation & CI/CD Pipeline Integration',
    domain: 'CI/CD & DevOps',
    company: 'Centric Consulting',
    problem: 'Client engagements required rapid quality engineering modernization, moving from legacy manual QA processes to robust automated delivery pipelines.',
    responsibility: 'Served as QA Consultant designing end-to-end automation strategies across UI and API layers for diverse client platforms.',
    approach: 'Built reusable UI and API automation frameworks, embedded automated smoke and regression suites into client CI/CD build gates, and mentored engineering teams on testing best practices.',
    technologies: ['Selenium', 'Java', 'REST Assured', 'Azure DevOps', 'Jenkins', 'Git'],
    outcome: 'Accelerated client release confidence, shortened regression test cycles, and established scalable continuous testing standards.',
    featured: false,
  },
  {
    id: 'travel-booking-engine-verification',
    title: 'High-Volume Travel Booking Engine Verification',
    domain: 'Backend & API Automation',
    company: 'Fareportal',
    problem: 'High-traffic travel search and booking engines demanded strict response-time consistency and zero transactional booking errors during peak load.',
    responsibility: 'SDET responsible for end-to-end API test automation and integration testing across flight search and booking transaction flows.',
    approach: 'Developed automated API test suites to validate complex pricing rules, fare calculation logic, and booking workflows across third-party travel supplier integrations.',
    technologies: ['Java', 'REST APIs', 'TestNG', 'SQL', 'Jenkins', 'Postman'],
    outcome: 'Reduced booking flow defect leakage and improved reliability for high-volume consumer travel transactions.',
    featured: false,
  },
  {
    id: 'healthcare-claims-data-verification',
    title: 'Healthcare Claims Data Integrity & Regression Automation',
    domain: 'Quality Engineering & Data Verification',
    company: 'United Health Group',
    problem: 'Complex healthcare claims processing required stringent data compliance, deterministic calculation validation, and zero tolerance for data corruption.',
    responsibility: 'Automated data validation pipelines and functional regression test suites for healthcare processing modules.',
    approach: 'Created automated backend validation scripts and functional test harnesses targeting database schemas, ETL feeds, and claims adjudications.',
    technologies: ['Java', 'Selenium', 'SQL', 'TestNG', 'Oracle DB', 'Maven'],
    outcome: 'Verified data integrity across extensive claims processing pipelines, ensuring compliance and reducing manual data verification effort.',
    featured: false,
  },
  {
    id: 'benefits-administration-automation',
    title: 'Benefits Administration Automation & Test Harness Design',
    domain: 'Test Automation',
    company: 'Aon Hewitt',
    problem: 'Legacy benefits enrollment and administration workflows suffered from repetitive manual testing cycles during annual enrollment windows.',
    responsibility: 'Developed automated test scripts and verification routines for employee benefits administration systems.',
    approach: 'Built automation suites for web-based enrollment portals and batch data verification jobs to validate payroll and benefits calculations.',
    technologies: ['Java', 'Selenium WebDriver', 'SQL', 'JUnit', 'SVN'],
    outcome: 'Established automated regression coverage for core benefits calculations and eliminated repetitive manual test execution during critical enrollment periods.',
    featured: false,
  },
];

