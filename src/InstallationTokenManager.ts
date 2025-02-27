import { createAppAuth } from '@octokit/auth-app';

interface TokenCacheEntry {
  token: string;
  expiresAt: number;
}

export class InstallationTokenManager {
  private tokenCache = new Map<string, TokenCacheEntry>();

  async getToken(installationId: number): Promise<string> {
    // console.log(`Installation ID: ${installationId}`)
    const key = installationId.toString();
    const cached = this.tokenCache.get(key);

    // Use a buffer of 30 seconds before expiration
    if (cached && cached.expiresAt > Date.now() + 30000) {
      // console.log('Cache hit: true')
      // console.log(`Token: ${cached.token}`)
      // console.log(`Expires: ${new Date(cached.expiresAt).toLocaleString()}`);
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
    // console.log('Cache hit: false')
    // console.log(`Token: ${result.token}`)
    // console.log(`Expires: ${new Date(expiresAt).toLocaleString()}`);
    return result.token;
  }
}
