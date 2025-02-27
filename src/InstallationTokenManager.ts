import { createAppAuth } from '@octokit/auth-app';

interface TokenCacheEntry {
  token: string;
  expiresAt: number;
}

export class InstallationTokenManager {
  private tokenCache = new Map<string, TokenCacheEntry>();

  async getToken(installationId: number): Promise<string> {
    const key = installationId.toString();
    const cached = this.tokenCache.get(key);

    // Use a buffer of 30 seconds before expiration
    if (cached && cached.expiresAt > Date.now() + 30000) {
      return cached.token;
    }

    const privateKey = process.env.GITHUB_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('GITHUB_PRIVATE_KEY is not defined in the environment.');
    }

    const auth = createAppAuth({
      appId: Number(process.env.GITHUB_APP_ID),
      privateKey: privateKey,
      installationId,
    });

    const result = await auth({ type: 'installation' });
    const expiresAt = new Date(result.expiresAt).getTime();
    this.tokenCache.set(key, { token: result.token, expiresAt });
    return result.token;
  }
}
