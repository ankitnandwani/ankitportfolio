import { env } from './env';
import type { GitHubRepoData } from './types';

/**
 * Simple in-memory cache with TTL.
 */
type CacheEntry = {
  data: GitHubRepoData;
  timestamp: number;
};

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Parses a GitHub URL to extract owner and repo.
 * Supports formats like:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo/
 *   git@github.com:owner/repo.git
 *   owner/repo (just in case)
 * Returns null if unable to parse.
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    // Remove trailing slash
    url = url.trim().replace(/\/+$/, '');

    // If it's already in the form owner/repo (no protocol)
    if (!url.includes('://') && !url.includes('@')) {
      const parts = url.split('/');
      if (parts.length === 2 && parts[0] && parts[1]) {
        return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') };
      }
      return null;
    }

    // Handle SSH-like URLs: git@github.com:owner/repo.git
    if (url.startsWith('git@github.com:')) {
      const path = url.slice('git@github.com:'.length);
      const parts = path.split('/');
      if (parts.length >= 2) {
        const owner = parts[0];
        let repo = parts[1];
        // Remove .git suffix if present
        if (repo.endsWith('.git')) {
          repo = repo.slice(0, -4);
        }
        if (owner && repo) {
          return { owner, repo };
        }
      }
      return null;
    }

    // Handle http(s) URLs
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'github.com') {
      return null;
    }
    const pathParts = urlObj.pathname.slice(1).split('/'); // remove leading slash
    if (pathParts.length >= 2) {
      const owner = pathParts[0];
      let repo = pathParts[1];
      // Remove .git suffix if present
      if (repo.endsWith('.git')) {
        repo = repo.slice(0, -4);
      }
      if (owner && repo) {
        return { owner, repo };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches repository data from the GitHub API with caching.
 * @param identifier Either a GitHub URL string or an object with `owner` and `repo`.
 * @returns A promise that resolves to the repository data or null on failure.
 */
export async function fetchGitHubRepoData(
  identifier: string | { owner: string; repo: string }
): Promise<GitHubRepoData | null> {
  let owner: string;
  let repo: string;

  if (typeof identifier === 'string') {
    const parsed = parseGitHubUrl(identifier);
    if (!parsed) {
      return null;
    }
    owner = parsed.owner;
    repo = parsed.repo;
  } else {
    owner = identifier.owner;
    repo = identifier.repo;
  }

  // Validate inputs
  if (!owner || !repo) {
    return null;
  }

  const cacheKey = `${owner}/${repo}`;
  const now = Date.now();

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Fetch from GitHub API
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `token ${env.GITHUB_TOKEN}`,
          // Accept header to get JSON
          Accept: 'application/vnd.github+json',
        },
        // Optional: set timeout? Not needed for now.
      }
    );

    if (!response.ok) {
      // If we get a 404, 403, etc., return null
      // Optionally log the error (but avoid leaking token)
      console.warn(
        `GitHub API request failed for ${cacheKey}: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();

    // Map the GitHub API response to our interface
    const repoData: GitHubRepoData = {
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      language: data.language ?? null,
      description: data.description ?? null,
      updatedAt: data.updated_at ?? new Date().toISOString(),
      open_issues: data.open_issues,
      subscribers_count: data.subscribers_count,
    };

    // Store in cache
    cache.set(cacheKey, {
      data: repoData,
      timestamp: now,
    });

    return repoData;
  } catch (error) {
    // Network error, JSON parsing error, etc.
    console.error(`Error fetching GitHub repo ${cacheKey}:`, error);
    return null;
  }
}