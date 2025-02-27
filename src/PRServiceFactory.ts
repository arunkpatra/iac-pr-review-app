import { IPRService, IPlatformConfig } from './types.js';
import { GitHubPRService } from './GitHubPRService.js';
import { GitLabPRService } from './GitLabPRService.js';

export type Platform = 'github' | 'gitlab';

export class PRServiceFactory {
  static createService(
    platform: Platform,
    config: IPlatformConfig,
    options: { owner?: string; repo?: string; projectId?: string; installationId?: number }
  ): IPRService {
    if (platform === 'github') {
      if (!options.owner || !options.repo || !options.installationId) {
        throw new Error('Owner, repo, and installationId are required for GitHub.');
      }
      return new GitHubPRService(config, options.owner, options.repo, options.installationId, new (require('./InstallationTokenManager').InstallationTokenManager)());
    } else if (platform === 'gitlab') {
      if (!options.projectId) {
        throw new Error('ProjectId is required for GitLab.');
      }
      return new GitLabPRService(config, options.projectId);
    }
    throw new Error('Unsupported platform');
  }
}

