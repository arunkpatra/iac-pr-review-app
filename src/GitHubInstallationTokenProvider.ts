/**
 * GitHubInstallationTokenProvider
 *
 * This class handles the retrieval and caching of GitHub App installation tokens.
 * It uses the `@octokit/auth-app` package to generate tokens based on the GitHub App credentials
 * provided via environment variables. Tokens are cached to reduce redundant API calls and are considered
 * valid until 30 seconds before their actual expiration time.
 *
 * Environment Variables:
 * - GITHUB_APP_ID: The GitHub App's numeric ID.
 * - GITHUB_PRIVATE_KEY: The GitHub App's private key (PEM formatted).
 */

import { createAppAuth } from '@octokit/auth-app';

interface TokenCacheEntry {
  token: string;
  expiresAt: number;
}

export class GitHubInstallationTokenProvider {
  private tokenCache = new Map<string, TokenCacheEntry>();

  /**
   * Retrieves an installation token for the given installation ID.
   *
   * This method first checks if a valid token exists in the cache. A token is considered valid if its
   * expiration time is at least 30 seconds in the future. If a valid token is found, it is returned.
   * Otherwise, a new token is generated using the GitHub App credentials, cached, and then returned.
   *
   * @param installationId - The GitHub App installation ID.
   * @returns A Promise that resolves to the installation token as a string.
   * @throws An error if the GITHUB_PRIVATE_KEY environment variable is not defined.
   */
  async getToken(installationId: number): Promise<string> {
    const key = installationId.toString();
    const cached = this.tokenCache.get(key);

    // Use a buffer of 30 seconds before expiration to ensure token validity.
    if (cached && cached.expiresAt > Date.now() + 30000) {
      return cached.token;
    }

    const privateKey = process.env.GITHUB_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('GITHUB_PRIVATE_KEY is not defined in the environment.');
    }

    // Create an authentication instance to fetch a new installation token.
    const auth = createAppAuth({
      appId: Number(process.env.GITHUB_APP_ID),
      privateKey: privateKey,
      installationId,
    });

    const result = await auth({ type: 'installation' });
    const expiresAt = new Date(result.expiresAt).getTime();

    // Cache the new token for future use.
    this.tokenCache.set(key, { token: result.token, expiresAt });
    return result.token;
  }
}
