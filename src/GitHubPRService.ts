import { IPRService, IReviewComment, IPlatformConfig } from './types.js';
import { Octokit } from '@octokit/rest';
import { InstallationTokenManager } from './InstallationTokenManager.js';

export class GitHubPRService implements IPRService {
  private owner: string;
  private repo: string;
  private installationId: number;
  private tokenManager: InstallationTokenManager;

  constructor(
    private config: IPlatformConfig,
    owner: string,
    repo: string,
    installationId: number,
    tokenManager: InstallationTokenManager
  ) {
    this.owner = owner;
    this.repo = repo;
    this.installationId = installationId;
    this.tokenManager = tokenManager;
  }

  private async getOctokit(): Promise<Octokit> {
    const token = await this.tokenManager.getToken(this.installationId);
    return new Octokit({ auth: token });
  }

  async postReviewComment(comment: IReviewComment): Promise<IReviewComment> {
    const octokit = await this.getOctokit();
    const response = await octokit.pulls.createReviewComment({
      owner: this.owner,
      repo: this.repo,
      pull_number: parseInt(comment.prId, 10),
      commit_id: 'HEAD', // Adjust as needed
      path: comment.filePath,
      line: comment.lineNumber,
      body: comment.comment,
    });

    return {
      id: response.data.id.toString(),
      prId: comment.prId,
      filePath: comment.filePath,
      lineNumber: comment.lineNumber,
      comment: comment.comment,
      createdAt: new Date(response.data.created_at)
    };
  }

  async updateReviewComment(commentId: string, updatedText: string): Promise<IReviewComment> {
    const octokit = await this.getOctokit();
    const response = await octokit.pulls.updateReviewComment({
      owner: this.owner,
      repo: this.repo,
      comment_id: parseInt(commentId, 10),
      body: updatedText,
    });

    return {
      id: response.data.id.toString(),
      prId: response.data.pull_request_url.split('/').pop() || "",
      filePath: response.data.path,
      lineNumber: response.data.position || 0,
      comment: updatedText,
      createdAt: new Date(response.data.updated_at)
    };
  }

  async deleteReviewComment(commentId: string): Promise<void> {
    const octokit = await this.getOctokit();
    await octokit.pulls.deleteReviewComment({
      owner: this.owner,
      repo: this.repo,
      comment_id: parseInt(commentId, 10)
    });
  }
}

