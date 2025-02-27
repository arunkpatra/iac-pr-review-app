// PRHandler.ts
import {GitHubPRService} from './GitHubPRService.js';

export class PRHandler {
    /**
     * Handle pull request events.
     * For example, if a PR is opened, post a comment.
     */
    static async handlePullRequestEvent(
        payload: any,
        githubService: GitHubPRService
    ): Promise<void> {


        // Check the action and perform the appropriate operation.
        if (payload.action === 'opened' ||
            payload.action === 'synchronize') {
            const generalComment = 'Overall, this file looks good!';
            await githubService.postFileLevelReviewComment(
                payload.pull_request.number.toString(),
                generalComment,
                payload.pull_request.head.sha
            );
            console.log('Posted file-level comment');
        } else if (payload.action === 'closed') {
            // Handle closed PR if needed.
            console.log('PR closed. No action taken.');
        } else {
            console.log(`Unhandled pull_request action: ${payload.action}`);
        }
    }
}
