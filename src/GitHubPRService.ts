import {IPRService, IReviewComment, IPlatformConfig} from './types.js';
import {Octokit} from '@octokit/rest';
import {InstallationTokenManager} from './InstallationTokenManager.js';

export class GitHubPRService implements IPRService {
    private readonly owner: string;
    private readonly repo: string;
    private readonly installationId: number;
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
        return new Octokit({auth: token});
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

    // New method to test the setup by getting GitHub's Zen message.
    async getZen(): Promise<string> {
        const octokit = await this.getOctokit();
        const {data} = await octokit.request('GET /zen');
        return data;
    }


  /**
   * Post a file level comment
   * @param prId
   * @param comment
   * @param commitId
   */
    async postFileLevelReviewComment(
        prId: string,
        comment: string,
        commitId: string
    ): Promise<any> {
        const octokit = await this.getOctokit();

        const iterator =
            octokit.paginate.iterator(octokit.pulls.listFiles, {
                owner: this.owner,
                repo: this.repo,
                pull_number: parseInt(prId, 10),
                per_page: 100,
            });

        // iterate through each response
        for await (const {data: files} of iterator) {
            for (const file of files) {
                const filePath = file.filename;
                console.log("File : %s, SHA: %s", filePath, file.sha);

                const response = await octokit.pulls.createReviewComment({
                    owner: this.owner,
                    repo: this.repo,
                    pull_number: parseInt(prId, 10),
                    commit_id: commitId,
                    path: filePath,
                    body: comment,
                    subject_type: 'file'
                });
            }
        }
    }

}

