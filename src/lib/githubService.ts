import { env } from './env.ts';
import type { GitHubRepoData, GitHubRepoIdentifier } from './types.ts';
import { parseGitHubUrl } from './githubUrl.ts';

/**
 * Simple in-memory cache with TTL.
 */
type CacheEntry = {
  data: GitHubRepoData;
  timestamp: number;
};

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 100;

/**
 * Ensures the cache does not exceed MAX_CACHE_SIZE by removing the oldest entries.
 */
function enforceCacheSize() {
  if (cache.size <= MAX_CACHE_SIZE) {
    return;
  }
  // Convert to array of objects for sorting
  const entries: { key: string; timestamp: number }[] = Array.from(cache.entries()).map(
    ([key, value]) => ({ key, timestamp: value.timestamp })
  );
  // Sort by timestamp ascending (oldest first)
  entries.sort((a, b) => a.timestamp - b.timestamp);
  // Remove excess entries (oldest ones)
  const excess = cache.size - MAX_CACHE_SIZE;
  for (let i = 0; i < excess; i++) {
    cache.delete(entries[i].key);
  }
}

/**
 * Fetches repository data from the GitHub API with caching.
 * @param identifier - Either a GitHub URL string or an object with `owner` and `repo`.
 * @returns A promise that resolves to the repository data (stars, forks, language, etc.) or null on failure.
 * @note The function uses the `GITHUB_TOKEN` environment variable for authentication.
 * @note Results are cached for 1 hour to prevent redundant requests.
 */
export async function fetchGitHubRepoData(
  identifier: GitHubRepoIdentifier
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
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[GitHub Cache] HIT for ${cacheKey}`);
    }
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
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[GitHub Cache] MISS for ${cacheKey}`);
    }
    enforceCacheSize(); // Ensure we don't exceed limit before adding
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