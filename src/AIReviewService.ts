/**
 * AIReviewService Module
 *
 * This module interacts with an external AI workflow engine to generate a review
 * for a given file. It sends a POST request to the external API and returns the review text.
 */

import axios from 'axios';
import {AIReview} from "./types.js";

export class AIReviewService {
    /**
     * Retrieves a review for the specified file by calling the external AI workflow engine.
     *
     * The external API is expected to return a JSON object with the following attributes:
     * - summary: A brief summary review.
     * - security: Security-related review points.
     * - best_practices: Best practices review.
     *
     * The returned object is transformed into the AIReview interface.
     *
     * @param filePath - The relative path of the file to review.
     * @returns A promise that resolves to an AIReview object.
     */
    static async getFileReview(filePath: string): Promise<AIReview> {
        const aiWorkflowUrl = process.env.AI_WORKFLOW_URL;
        const mockReview = process.env.MOCK_AI_REVIEW === 'true';

        if (mockReview) {
            console.log('Returning mock review for', filePath);
            return {
                summary: `Mock summary for ${filePath}`,
                security: `Mock security review for ${filePath}`,
                bestPractices: `Mock best practices for ${filePath}`,
                status: 'Ok'
            };
        }

        if (!aiWorkflowUrl) {
            console.error('AI_WORKFLOW_URL is not defined in environment variables.');
            return {
                status: 'Error'
            };
        }

        try {
            const response = await axios.post<{ summary: string; security: string; best_practices: string }>(
                aiWorkflowUrl,
                { filePath }
            );
            const { summary, security, best_practices } = response.data;
            return {
                summary,
                security,
                bestPractices: best_practices,
                status: 'Ok'
            };
        } catch (error) {
            console.error(`Error fetching review for ${filePath}:`, error);
            return {
                status: 'Error'
            };
        }
    }
}
