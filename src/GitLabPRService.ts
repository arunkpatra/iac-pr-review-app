import {IPRService, IReviewComment, IPlatformConfig, IPullRequestFile} from './types.js';

export class GitLabPRService implements IPRService {
  constructor(private config: IPlatformConfig, private projectId: string) {
    // Initialize GitLab API client when implementing.
  }

  async postReviewComment(comment: IReviewComment): Promise<IReviewComment> {
    throw new Error('GitLab integration not implemented yet');
  }

  async updateReviewComment(commentId: string, updatedText: string): Promise<IReviewComment> {
    throw new Error('GitLab integration not implemented yet');
  }

  async deleteReviewComment(commentId: string): Promise<void> {
    throw new Error('GitLab integration not implemented yet');
  }

  listPullRequestFiles(prId: number): Promise<IPullRequestFile[]> {
    throw new Error('GitLab integration not implemented yet');
  }

  postFileLevelReviewComment(prId: number, comment: string, commitId: string, filePath: string): Promise<string> {
    throw new Error('GitLab integration not implemented yet');
  }
}

