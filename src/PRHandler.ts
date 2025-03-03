/**
 * PRHandler Module
 *
 * This module encapsulates the logic for processing pull request events.
 * For 'opened' and 'synchronize' events, it:
 *  1. Lists all files in the pull request.
 *  2. Logs file details.
 *  3. For each file, checks if its SHA has changed (by looking up the record in the DB).
 *     - If unchanged, the file is skipped.
 *     - If changed (or no record exists), a file-level review comment is posted and the DB is updated.
 *
 * For 'closed' events, no further processing is done.
 */

import prisma from './prismaClient.js';
import {IPRService} from "./types.js";

/**
 * Processes a single file within a pull request.
 *
 * It checks if a database record exists for the file (using a composite key of provider, repo, owner, and filePath)
 * and compares the stored SHA with the current SHA. If they differ, a new file-level review comment is posted,
 * and the record is upserted.
 *
 * @param payload - The pull request event payload.
 * @param file - The file information from the pull request.
 * @param generalComment - The comment text to post on the file.
 * @param prService - An instance of IPRService used to interact with GitHub.
 */
async function processFile(
    payload: any,
    file: any,
    generalComment: string,
    prService: IPRService
): Promise<void> {
    // Check if a record exists for this file.
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
        return;
    }

    // Post a file-level review comment for the file.
    const commentId = await prService.postFileLevelReviewComment(
        payload.pull_request.number,
        generalComment,
        payload.pull_request.head.sha,
        file.filename
    );
    console.log(`Posted file-level comment for ${file.filename} with comment ID: ${commentId}`);

    // Upsert the record in the database.
    await prisma.pRReviewComment.upsert({
        where: {
            provider_repo_owner_filePath: {
                provider: 'GitHub',
                repo: payload.repository.name,
                owner: payload.repository.owner.login,
                filePath: file.filename,
            },
        },
        update: {
            fileSha: file.sha,
            commentId: commentId,
        },
        create: {
            provider: 'GitHub',
            repo: payload.repository.name,
            owner: payload.repository.owner.login,
            filePath: file.filename,
            fileSha: file.sha,
            commentId: commentId,
        },
    });
    console.log(`Upserted DB record for ${file.filename}`);
}

/**
 * Handles pull request events by processing each file in the pull request.
 *
 * For 'opened' and 'synchronize' events, it:
 *  - Retrieves a list of files in the pull request.
 *  - Logs details about each file.
 *  - Processes each file using the processFile helper.
 *
 * For 'closed' events, it logs a message and takes no further action.
 *
 * @param payload - The pull request event payload.
 * @param prService - An instance of IPRService for interacting with GitHub.
 */
export class PRHandler {
    static async handlePullRequestEvent(
        payload: any,
        prService: IPRService
    ): Promise<void> {
        const action = payload.action;
        if (action === 'opened' || action === 'synchronize') {
            const prNumber = payload.pull_request.number;
            // Retrieve the list of files in the PR.
            const files = await prService.listPullRequestFiles(prNumber);
            console.log('Files in the PR:');
            files.forEach(file => {
                console.log(`Filename: ${file.filename}`);
                console.log(`SHA: ${file.sha}`);
                console.log(`Status: ${file.status}`);
                console.log(`Additions: ${file.additions}`);
                console.log(`Deletions: ${file.deletions}`);
                console.log(`Changes: ${file.changes}`);
            });

            const generalComment = 'Overall, this file looks good!';

            // Process each file.
            for (const file of files) {
                await processFile(payload, file, generalComment, prService);
            }
        } else if (action === 'closed') {
            console.log('PR closed. No action taken.');
        } else {
            console.log(`Unhandled pull_request action: ${action}`);
        }
    }
}
