/**
 * PRHandler Module
 *
 * This module encapsulates the logic for processing pull request events.
 * For 'opened' and 'synchronize' events, it:
 *  1. Retrieves the list of files in the pull request.
 *  2. Logs file details.
 *  3. Processes each file:
 *     - If a database record exists and the file SHA is unchanged, no comment is added.
 *     - If a record exists but the file SHA has changed, it attempts to update the existing comment.
 *       If updating fails (e.g. because the comment was manually deleted on GitHub),
 *       a new file-level review comment is posted.
 *     - If no record exists, a new file-level review comment is posted.
 *     - The database is updated accordingly.
 *
 * For 'closed' events, no further processing is done.
 */

import prisma from './prismaClient.js';
import { IPRService } from './types.js';
import {AIReviewService} from "./AIReviewService.js";
import {ReviewFormatter} from "./ReviewFormatter.js";

/**
 * Processes a single file within a pull request.
 *
 * This function first calls the external AI workflow engine to retrieve a review comment
 * for the file. It then checks if a database record exists for the file (using a composite key of provider, repo, owner, and filePath)
 * and compares the stored SHA with the current SHA. If the file has changed, it attempts to update the existing GitHub comment.
 * If updating fails (e.g. because the comment was manually deleted on GitHub), it posts a new comment.
 * The database record is then upserted accordingly.
 *
 * @param payload - The pull request event payload.
 * @param file - The file object from the pull request.
 * @param prService - An instance of IPRService used to interact with GitHub.
 */
async function processFile(
    payload: any,
    file: any,
    prService: IPRService
): Promise<void> {

    // Retrieve the review comment for this file from the external AI workflow engine.
    const aiReview = await AIReviewService.getFileReview(file.filename);
    // Format the review as Markdown.
    const formattedReview = ReviewFormatter.formatReview(aiReview);

    // Look up in the DB using the composite key (provider, repo, owner, filePath).
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

    // If record exists and file SHA hasn't changed, skip processing.
    if (existingRecord && existingRecord.fileSha === file.sha) {
        console.log(`File ${file.filename} unchanged (SHA: ${file.sha}); skipping comment.`);
        return;
    }

    // If a record exists and the file SHA has changed, try to update the existing comment.
    if (existingRecord) {
        try {
            // Attempt to update the existing GitHub comment.
            await prService.updateReviewComment(existingRecord.commentId, formattedReview);
            console.log(`Updated file-level comment for ${file.filename} (ID: ${existingRecord.commentId}).`);

            // Update the record in the database with the new SHA.
            await prisma.pRReviewComment.update({
                where: {
                    provider_repo_owner_filePath: {
                        provider: 'GitHub',
                        repo: payload.repository.name,
                        owner: payload.repository.owner.login,
                        filePath: file.filename,
                    },
                },
                data: {
                    fileSha: file.sha,
                },
            });
            console.log(`Updated DB record for ${file.filename}.`);
            return;
        } catch (error) {
            console.warn(`Failed to update comment for ${file.filename}: ${error}. Will post a new comment.`);
            // Fall through to post a new comment if updating fails.
        }
    }

    // If no record exists or update failed, post a new file-level review comment.
    const newCommentId = await prService.postFileLevelReviewComment(
        payload.pull_request.number,
        formattedReview,
        payload.pull_request.head.sha,
        file.filename
    );
    console.log(`Posted new file-level comment for ${file.filename} with comment ID: ${newCommentId}.`);

    // Upsert the DB record with the new comment ID and file SHA.
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
            commentId: newCommentId,
        },
        create: {
            provider: 'GitHub',
            repo: payload.repository.name,
            owner: payload.repository.owner.login,
            filePath: file.filename,
            fileSha: file.sha,
            commentId: newCommentId,
        },
    });
    console.log(`Upserted DB record for ${file.filename}.`);
}

/**
 * Handles pull request events by processing each Terraform file (.tf) in the pull request.
 *
 * For 'opened' and 'synchronize' events, it:
 *  - Retrieves the list of files in the pull request.
 *  - Logs details about each file.
 *  - Filters the list to only process files with a ".tf" extension.
 *  - Processes each Terraform file using the processFile helper.
 *
 * For 'closed' events, it logs a message and takes no further action.
 *
 * @param payload - The pull request event payload.
 * @param prService - An instance of IPRService for interacting with the PR provider.
 */
export class PRHandler {
    static async handlePullRequestEvent(
        payload: any,
        prService: IPRService
    ): Promise<void> {
        const action = payload.action;
        if (action === 'opened' || action === 'synchronize') {
            const prNumber = payload.pull_request.number;
            // Retrieve the list of files in the pull request.
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

            // Filter to process only Terraform (.tf) files.
            const terraformFiles = files.filter(file => file.filename.endsWith('.tf'));
            if (terraformFiles.length === 0) {
                console.log("No Terraform (.tf) files found in the PR; nothing to process.");
                return;
            }

            // Process each Terraform file asynchronously.
            for (const file of terraformFiles) {
                await processFile(payload, file, prService);
            }
        } else if (action === 'closed') {
            console.log('PR closed. No action taken.');
        } else {
            console.log(`Unhandled pull_request action: ${action}`);
        }
    }
}
