/**
 * PRServiceFactory Module
 *
 * This module provides a factory for creating instances of pull request (PR)
 * services based on the specified platform (GitHub or GitLab).
 *
 * It validates that the required options are provided for each platform and
 * returns an instance that implements the IPRService interface.
 */

import { IPRService, IPlatformConfig } from './types.js';
import { GitHubPRService } from './GitHubPRService.js';
import { GitLabPRService } from './GitLabPRService.js';
import { GitHubInstallationTokenProvider } from './GitHubInstallationTokenProvider.js';

/**
 * Supported platform types.
 */
export type Platform = 'github' | 'gitlab';

/**
 * Shared instance of GitHubInstallationTokenProvider to ensure caching is maintained
 * across multiple service instantiations.
 */
const githubSharedTokenManager = new GitHubInstallationTokenProvider();

/**
 * Factory for creating PR service instances.
 */
export class PRServiceFactory {
  /**
   * Creates an instance of a PR service based on the specified platform.
   *
   * @param platform - The target platform ('github' or 'gitlab').
   * @param config - Platform configuration including authentication details.
   * @param options - Additional options required for service instantiation.
   *   - For GitHub: owner, repo, and installationId are required.
   *   - For GitLab: projectId is required.
   *
   * @returns An instance of IPRService appropriate for the selected platform.
   * @throws An error if required options for the selected platform are missing or if the platform is unsupported.
   */
  static createService(
      platform: Platform,
      config: IPlatformConfig,
      options: { owner?: string; repo?: string; projectId?: string; installationId?: number }
  ): IPRService {
    if (platform === 'github') {
      if (!options.owner || !options.repo || !options.installationId) {
        throw new Error('Owner, repo, and installationId are required for GitHub.');
      }
      // Use the shared GitHubInstallationTokenProvider instance.
      return new GitHubPRService(
          config,
          options.owner,
          options.repo,
          options.installationId,
          githubSharedTokenManager
      );
    } else if (platform === 'gitlab') {
      if (!options.projectId) {
        throw new Error('ProjectId is required for GitLab.');
      }
      return new GitLabPRService(config, options.projectId);
    }
    throw new Error('Unsupported platform');
  }
}
