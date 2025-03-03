/**
 * GitHubPRService
 *
 * This service implements the IPRService interface to perform GitHub pull request
 * operations, such as posting inline review comments, updating or deleting comments,
 * listing files in a PR, and posting file-level review comments.
 *
 * It leverages the Octokit REST client for API calls and uses an GitHubInstallationTokenProvider
 * to retrieve and cache installation access tokens.
 */

import { IPRService, IReviewComment, IPlatformConfig, IPullRequestFile } from './types.js';
import { Octokit } from '@octokit/rest';
import { GitHubInstallationTokenProvider } from './GitHubInstallationTokenProvider.js';

export class GitHubPRService implements IPRService {
    private readonly owner: string;
    private readonly repo: string;
    private readonly installationId: number;
    private tokenManager: GitHubInstallationTokenProvider;

    /**
     * Constructs a new GitHubPRService.
     *
     * @param config - Platform configuration (token, baseUrl, etc.).
     * @param owner - Repository owner.
     * @param repo - Repository name.
     * @param installationId - GitHub App installation ID.
     * @param tokenManager - Instance of GitHubInstallationTokenProvider for token retrieval.
     */
    constructor(
        private config: IPlatformConfig,
        owner: string,
        repo: string,
        installationId: number,
        tokenManager: GitHubInstallationTokenProvider
    ) {
        this.owner = owner;
        this.repo = repo;
        this.installationId = installationId;
        this.tokenManager = tokenManager;
    }

    /**
     * Retrieves an authenticated Octokit instance using the installation token.
     *
     * @returns A Promise that resolves to an Octokit client.
     */
    private async getOctokit(): Promise<Octokit> {
        const token = await this.tokenManager.getToken(this.installationId);
        return new Octokit({ auth: token });
    }

    /**
     * Posts an inline review comment on a pull request.
     *
     * @param comment - The review comment details.
     * @returns A Promise that resolves with the created review comment.
     */
    async postReviewComment(comment: IReviewComment): Promise<IReviewComment> {
        const octokit = await this.getOctokit();
        const response = await octokit.pulls.createReviewComment({
            owner: this.owner,
            repo: this.repo,
            pull_number: parseInt(comment.prId, 10),
            commit_id: 'HEAD',
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
            createdAt: new Date(response.data.created_at),
        };
    }

    /**
     * Updates an existing review comment.
     *
     * @param commentId - The identifier of the comment to update.
     * @param updatedText - The new text for the comment.
     * @returns A Promise that resolves with the updated review comment.
     */
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
            createdAt: new Date(response.data.updated_at),
        };
    }

    /**
     * Deletes an existing review comment.
     *
     * @param commentId - The identifier of the comment to delete.
     * @returns A Promise that resolves when the comment is deleted.
     */
    async deleteReviewComment(commentId: string): Promise<void> {
        const octokit = await this.getOctokit();
        await octokit.pulls.deleteReviewComment({
            owner: this.owner,
            repo: this.repo,
            comment_id: parseInt(commentId, 10),
        });
    }

    /**
     * Retrieves GitHub's Zen message to test API connectivity.
     *
     * @returns A Promise that resolves with GitHub's Zen message.
     */
    async getZen(): Promise<string> {
        const octokit = await this.getOctokit();
        const { data } = await octokit.request('GET /zen');
        return data;
    }

    /**
     * Posts a file-level review comment on a pull request.
     * The comment applies to the file as a whole (subject_type = 'file').
     *
     * @param prId - The pull request number.
     * @param comment - The text content of the comment.
     * @param commitId - The HEAD commit SHA of the pull request.
     * @param filePath - The relative file path in the repository.
     * @returns A Promise that resolves with the created comment's ID as a string.
     */
    async postFileLevelReviewComment(
        prId: number,
        comment: string,
        commitId: string,
        filePath: string
    ): Promise<string> {
        const octokit = await this.getOctokit();
        console.log(`Posting file-level comment for file: ${filePath}`);

        const response = await octokit.pulls.createReviewComment({
            owner: this.owner,
            repo: this.repo,
            pull_number: prId,
            commit_id: commitId,
            path: filePath,
            body: comment,
            subject_type: 'file',
        });

        return response.data.id.toString();
    }

    /**
     * Lists all files associated with a pull request.
     *
     * @param prId - The pull request number.
     * @returns A Promise that resolves with an array of pull request file details.
     */
    async listPullRequestFiles(prId: number): Promise<IPullRequestFile[]> {
        const octokit = await this.getOctokit();
        const response = await octokit.pulls.listFiles({
            owner: this.owner,
            repo: this.repo,
            pull_number: prId,
        });

        return response.data.map(file => ({
            filename: file.filename,
            sha: file.sha,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes,
        }));
    }
}
