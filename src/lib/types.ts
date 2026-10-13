/**
 * Type definitions for GitHub integration.
 */

export interface GitHubRepoData {
  /**
   * Number of stars the repository has received.
   */
  stars: number;

  /**
   * Number of forks the repository has.
   */
  forks: number;

  /**
   * Primary programming language (can be null).
   */
  language: string | null;

  /**
   * Repository description (can be null).
   */
  description: string | null;

  /**
   * Date and time the repository was last updated (ISO string).
   */
  updatedAt: string;

  /**
   * Number of open issues (optional).
   */
  open_issues?: number;

  /**
   * Number of subscribers (watchers) (optional).
   */
  subscribers_count?: number;
}

/**
 * Identifier for a GitHub repository, either as a URL string or as an object with owner and repo.
 */
export type GitHubRepoIdentifier = string | { owner: string; repo: string };