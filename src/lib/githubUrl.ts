/**
 * GitHub URL parsing helpers.
 *
 * Kept free of any imports so the parsing rules can be unit tested in
 * isolation, without pulling in environment validation or network access.
 */

/**
 * Parses a GitHub URL to extract owner and repo.
 * Supports formats like:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo/
 *   git@github.com:owner/repo.git
 *   owner/repo (just in case)
 * Returns null if unable to parse.
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
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
