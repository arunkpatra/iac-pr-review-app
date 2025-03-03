// Configuration for a platform (GitHub, GitLab, etc.)
export interface IPlatformConfig {
  token: string;
  baseUrl?: string;
}

// Data structure for a review comment
export interface IReviewComment {
  id?: string;
  prId: string;
  filePath: string;
  lineNumber: number;
  comment: string;
  createdAt?: Date;
}

export interface IPullRequestFile {
  filename: string;
  sha: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}

// Abstraction for PR operations
export interface IPRService {
  postReviewComment(comment: IReviewComment): Promise<IReviewComment>;
  updateReviewComment(commentId: string, updatedText: string): Promise<IReviewComment>;
  deleteReviewComment(commentId: string): Promise<void>;
  listPullRequestFiles(prId: number): Promise<IPullRequestFile[]>;
  postFileLevelReviewComment(
      prId: number,
      comment: string,
      commitId: string,
      filePath: string
  ): Promise<string>;
}

