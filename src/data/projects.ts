/**
 * Project data model for showcasing engineering projects.
 * 
 * Sourced from PRD §16 and §117:
 * The Projects section showcases engineering projects rather than simple technology lists.
 * Each project needs a well-defined structure capturing the name, value proposition,
 * category, motivation, learning outcomes, architectural highlights, technology stack,
 * and external links (GitHub, live demo).
 * 
 * @NOTE: Full verified data population will be completed in M08.02.
 * Do not invent professional information or metrics.
 */

export interface Project {
  /**
   * Unique string identifier for the project (e.g., 'ccgeek').
   */
  id: string;

  /**
   * Concise project name (e.g., "CCGeek").
   */
  name: string;

  /**
   * One-line description of what the project does or its primary benefit.
   */
  valueProposition: string;

  /**
   * Project category from the allowed set.
   */
  category: ProjectCategory;

  /**
   * Array of key tools/technologies utilized (e.g., ["Microsoft Graph", "PostgreSQL", "React", "Node.js"]).
   */
  technologies: string[];

  /**
   * Motivation and context for why the project was created.
   */
  whyBuilt: string;

  /**
   * Key skills, insights, or experiences gained from building the project.
   */
  whatLearned: string;

  /**
   * High-level architectural overview or key technical decisions.
   */
  architecture: string;

  /**
   * URL to the GitHub repository (optional if not applicable).
   */
  githubUrl?: string;

  /**
   * URL to live demo or deployment (optional if not applicable).
   */
  demoUrl?: string;

  /**
   * Optional boolean flag indicating if this project should be featured prominently on homepage.
   */
  featured?: boolean;
}

/**
 * Union type for valid project categories.
 */
export type ProjectCategory = 
  | "Professional"
  | "Personal Engineering"
  | "Engineering Lab"
  | "Finance"
  | "AI";

/**
 * Type alias for an array of projects.
 */
export type ProjectData = Project[];

/**
 * Verified project data list populated with factual engineering projects.
 * Sourced from professional experience, personal engineering projects, and approved project descriptions.
 * 
 * Do not invent professional information or metrics.
 */
export const projectsData: ProjectData = [
  {
    id: 'network-pricing-api-test-suite',
    name: 'Network Pricing API Test Suite',
    valueProposition: 'Automated test suite for validating high-throughput freight pricing APIs, ensuring accuracy and performance.',
    category: 'Professional',
    technologies: ['REST Assured', 'Java', 'Docker', 'GitLab CI', 'Kafka', 'PostgreSQL'],
    whyBuilt: 'To prevent pricing discrepancies and latency regressions in mission-critical logistics operations by providing continuous automated validation of freight rate APIs.',
    whatLearned: 'Expertise in designing scalable test automation frameworks, integrating with CI/CD pipelines, and ensuring high-throughput API reliability.',
    architecture: 'Modular REST API test automation suites with containerized execution, integrated into GitLab CI pipelines, utilizing Docker for isolation and Kafka for asynchronous verification.',
    featured: true,
  },
  {
    id: 'enterprise-cloud-test-framework',
    name: 'Enterprise Cloud Test Framework',
    valueProposition: 'Scalable test automation framework for enterprise backend services, enabling parallel execution and standardized reporting.',
    category: 'Professional',
    technologies: ['Java', 'TestNG', 'Cucumber', 'REST APIs', 'Jenkins', 'Maven'],
    whyBuilt: 'To address disconnected automation tools and manual test execution that slowed release cycles and caused inconsistent test reporting across distributed enterprise services.',
    whatLearned: 'Experience in building BDD-based test frameworks, implementing parallel execution pipelines, and standardizing test reporting for multi-tier systems.',
    architecture: 'Scalable test automation solution utilizing BDD principles, API test suites, and parallel execution pipelines for distributed cloud services.',
    featured: true,
  },
  {
    id: 'healthcare-claims-data-validation-automation',
    name: 'Healthcare Claims Data Validation Automation',
    valueProposition: 'Automated data validation pipelines ensuring compliance and reducing manual verification effort in healthcare claims processing.',
    category: 'Professional',
    technologies: ['Java', 'Selenium', 'SQL', 'TestNG', 'Oracle DB', 'Maven'],
    whyBuilt: 'To ensure data integrity, deterministic calculation validation, and zero tolerance for data corruption in complex healthcare claims processing.',
    whatLearned: 'Skills in creating automated backend validation scripts, functional test harnesses, and verifying data integrity across extensive claims processing pipelines.',
    architecture: 'Automated backend validation scripts and functional test harnesses targeting database schemas, ETL feeds, and claims adjudications.',
    featured: false,
  },
  {
    id: 'ccgeek',
    name: 'CCGeek',
    valueProposition: 'Chrome extension enhancing GitHub experience with productivity features for developers.',
    category: 'Personal Engineering',
    technologies: ['JavaScript', 'HTML', 'CSS', 'Chrome Extension APIs'],
    whyBuilt: 'To improve personal productivity and streamline common GitHub workflows.',
    whatLearned: 'Experience in building browser extensions, manipulating DOM, and interacting with GitHub\'s API.',
    architecture: 'Manifest V3 extension with content scripts injecting custom UI into GitHub pages, background service worker for API interactions.',
    featured: true,
  },
  {
    id: 'backtesting-engine',
    name: 'Backtesting Engine',
    valueProposition: 'Framework for backtesting trading strategies against historical market data.',
    category: 'Personal Engineering',
    technologies: ['Python', 'Pandas', 'NumPy', 'Matplotlib'],
    whyBuilt: 'To evaluate and optimize trading strategies before live deployment.',
    whatLearned: 'Knowledge of financial markets, statistical analysis, and efficient data processing techniques.',
    architecture: 'Event-driven backtesting engine with strategy interface, data handler, portfolio manager, and execution simulator.',
    featured: false,
  },
  {
    id: 'smart-contract-experiment',
    name: 'Smart Contract Experiment',
    valueProposition: 'Experimental exploration of smart contract functionality and decentralized application concepts.',
    category: 'Engineering Lab',
    technologies: ['Solidity', 'Ethereum', 'Hardhat', 'JavaScript'],
    whyBuilt: 'To understand blockchain technology and experiment with decentralized finance (DeFi) concepts.',
    whatLearned: 'Insights into smart contract development, gas optimization, and security considerations in blockchain.',
    architecture: 'Truffle/Hardhat project structure with smart contracts, migration scripts, and test suites.',
    featured: false,
  },
  {
    id: 'options-automation-system',
    name: 'Options Automation System',
    valueProposition: 'Automation system for executing and managing options trading strategies based on predefined rules.',
    category: 'Finance',
    technologies: ['Python', 'REST APIs', 'WebSocket', 'PostgreSQL'],
    whyBuilt: 'To automate options trading processes and reduce manual intervention in financial markets.',
    whatLearned: 'Knowledge of options pricing, risk management, and integration with brokerage APIs.',
    architecture: 'Rule-based engine with market data feed, strategy executor, risk management module, and order management system.',
    featured: false,
  },
  {
    id: 'prompt-engineering-framework',
    name: 'Prompt Engineering Framework',
    valueProposition: 'Toolkit for designing, testing, and optimizing prompts to improve LLM output quality and consistency.',
    category: 'AI',
    technologies: ['Python', 'Streamlit', 'OpenAPI', 'Pandas'],
    whyBuilt: 'To enhance the effectiveness of LLMs through systematic prompt engineering techniques.',
    whatLearned: 'Expertise in LLM behavior, prompt design principles, and iterative optimization methodologies.',
    architecture: 'Prompt testing interface, variation generator, result analyzer, and optimization algorithms.',
    featured: false,
  },
];