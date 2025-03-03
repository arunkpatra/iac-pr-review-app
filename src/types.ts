/**
 * Configuration settings for a given platform (e.g., GitHub, GitLab).
 */
export interface IPlatformConfig {
  /**
   * Access token used for authenticating API requests.
   */
  token: string;

  /**
   * Optional base URL override for the API.
   */
  baseUrl?: string;
}

/**
 * Represents a review comment attached to a pull request.
 */
export interface IReviewComment {
  /**
   * Unique identifier for the comment (if already created).
   */
  id?: string;

  /**
   * The pull request identifier.
   */
  prId: string;

  /**
   * The relative file path in the repository that the comment targets.
   */
  filePath: string;

  /**
   * The specific line number (or position) in the diff where the comment applies.
   */
  lineNumber: number;

  /**
   * The text content of the comment.
   */
  comment: string;

  /**
   * Timestamp when the comment was created.
   */
  createdAt?: Date;
}

/**
 * Represents a file that is part of a pull request.
 */
export interface IPullRequestFile {
  /**
   * The name (and path) of the file.
   */
  filename: string;

  /**
   * The SHA hash of the file version at the time of the PR.
   */
  sha: string;

  /**
   * The status of the file in the PR (e.g., modified, added, removed).
   */
  status: string;

  /**
   * The number of lines added in the file.
   */
  additions: number;

  /**
   * The number of lines deleted from the file.
   */
  deletions: number;

  /**
   * The total number of changes in the file (additions + deletions).
   */
  changes: number;
}

/**
 * Abstraction for pull request (PR) operations.
 * Provides methods to interact with pull request comments and file listings.
 */
export interface IPRService {
  /**
   * Posts an inline review comment on a pull request.
   *
   * @param comment - The review comment details.
   * @returns A promise that resolves with the created review comment.
   */
  postReviewComment(comment: IReviewComment): Promise<IReviewComment>;

  /**
   * Updates an existing review comment.
   *
   * @param commentId - The identifier of the comment to update.
   * @param updatedText - The new text content for the comment.
   * @returns A promise that resolves with the updated review comment.
   */
  updateReviewComment(commentId: string, updatedText: string): Promise<IReviewComment>;

  /**
   * Deletes an existing review comment.
   *
   * @param commentId - The identifier of the comment to delete.
   * @returns A promise that resolves when the comment is deleted.
   */
  deleteReviewComment(commentId: string): Promise<void>;

  /**
   * Lists all files that are part of a specific pull request.
   *
   * @param prId - The identifier of the pull request.
   * @returns A promise that resolves with an array of files in the pull request.
   */
  listPullRequestFiles(prId: number): Promise<IPullRequestFile[]>;

  /**
   * Posts a file-level review comment for a specific file in the pull request.
   * This comment applies to the file as a whole (subject_type = "file").
   *
   * @param prId - The identifier of the pull request.
   * @param comment - The text content of the comment.
   * @param commitId - The SHA of the commit against which the comment is posted.
   * @param filePath - The relative path of the file to comment on.
   * @returns A promise that resolves with the identifier of the created comment.
   */
  postFileLevelReviewComment(
      prId: number,
      comment: string,
      commitId: string,
      filePath: string
  ): Promise<string>;
}
