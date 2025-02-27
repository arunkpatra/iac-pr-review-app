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

// Abstraction for PR operations
export interface IPRService {
  postReviewComment(comment: IReviewComment): Promise<IReviewComment>;
  updateReviewComment(commentId: string, updatedText: string): Promise<IReviewComment>;
  deleteReviewComment(commentId: string): Promise<void>;
}

