// PRHandler.ts
import {GitHubPRService} from './GitHubPRService.js';
import prisma from './prismaClient.js';

export class PRHandler {
    /**
     * Handle pull request events.
     * For example, if a PR is opened, post a comment.
     */
    static async handlePullRequestEvent(
        payload: any,
        githubService: GitHubPRService
    ): Promise<void> {
        if (payload.action === 'opened' || payload.action === 'synchronize') {
            // List files in the PR.
            const files = await githubService.listPullRequestFiles(
                payload.pull_request.number
            );
            console.log('Files in the PR:');
            files.forEach(file => {
                console.log(`Filename: ${file.filename}`);
                console.log(`SHA: ${file.sha}`);
                console.log(`Status: ${file.status}`);
                console.log(`Additions: ${file.additions}`);
                console.log(`Deletions: ${file.deletions}`);
                console.log(`Changes: ${file.changes}`);
            });

            // Define a general comment to post on each file.
            const generalComment = 'Overall, this file looks good!';

            // Process each file.
            for (const file of files) {

                // Look up in the DB by provider, repo, owner, and filePath.
                const existingRecord = await prisma.pRReviewComment.findUnique({
                    where: {
                        provider_repo_owner_filePath: {
                            provider: 'GitHub',
                            repo: payload.repository.name,
                            owner: payload.repository.owner.login,
                            filePath: file.filename,
                        },
                    },
                });

                if (existingRecord && existingRecord.fileSha === file.sha) {
                    console.log(`File ${file.filename} unchanged (SHA: ${file.sha}); skipping comment.`);
                    continue;
                }

                // Post a file-level review comment for this file.
                const commentId = await githubService.postFileLevelReviewComment(
                    payload.pull_request.number,
                    generalComment,
                    payload.pull_request.head.sha,
                    file.filename // Pass the file path from the current file object.
                );
                console.log(
                    `Posted file-level comment for ${file.filename} with comment ID: ${commentId}`
                );

                // Insert a record in the database with provider, repo, owner, file SHA, and comment ID.
                await prisma.pRReviewComment.create({
                    data: {
                        provider: 'GitHub', // Adjust as necessary if you support multiple providers.
                        repo: payload.repository.name,
                        owner: payload.repository.owner.login,
                        filePath: file.filename,
                        fileSha: file.sha,
                        commentId: commentId,
                    },
                });
                console.log(`Inserted DB record for ${file.filename}`);
            }
        } else if (payload.action === 'closed') {
            console.log('PR closed. No action taken.');
        } else {
            console.log(`Unhandled pull_request action: ${payload.action}`);
        }
    }
}
