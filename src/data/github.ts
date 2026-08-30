/**
 * GitHub repository data model for caching and displaying repository metadata.
 * 
 * Sourced from PRD §20 and §118:
 * The website should periodically retrieve public repository information 
 * (stars, languages, etc.) and apply a curation layer.
 */

export interface GitHubRepository {
  /**
   * GitHub repository ID (numeric).
   */
  id: number;

  /**
   * Repository name (e.g., "ccgeek").
   */
  name: string;

  /**
   * Full repository name with owner (e.g., "ankitnaadwani/ccgeek").
   */
  fullName: string;

  /**
   * Repository description (can be null).
   */
  description: string | null;

  /**
   * URL to the repository on GitHub.
   */
  htmlUrl: string;

  /**
   * Number of stars the repository has received.
   */
  stargazersCount: number;

  /**
   * Number of forks the repository has.
   */
  forksCount: number;

  /**
   * Primary programming language (can be null).
   */
  language: string | null;

  /**
   * Date and time the repository was created.
   */
  createdAt: string; // ISO string

  /**
   * Date and time the repository was last updated.
   */
  updatedAt: string; // ISO string

  /**
   * Date and time of the last push to the repository.
   */
  pushedAt: string; // ISO string

  /**
   * Array of topic tags.
   */
  topics: string[];

  /**
   * Whether the repository is archived.
   */
  archived: boolean;

  /**
   * Whether the repository is disabled.
   */
  disabled: boolean;
}

/**
 * Type alias for an array of GitHub repositories.
 */
export type GitHubRepositoryData = GitHubRepository[];