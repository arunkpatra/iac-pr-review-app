/**
 * AIReviewService Module
 *
 * This module interacts with an external AI workflow engine to generate a review
 * for a given file. It sends a POST request to the external API and returns the review text.
 */

import axios from 'axios';

export class AIReviewService {
    /**
     * Retrieves a review for the specified file by calling the external AI workflow engine.
     *
     * @param filePath - The relative path of the file to review.
     * @returns A promise that resolves to the review comment as a string.
     */
    static async getFileReview(filePath: string): Promise<string> {
        const aiWorkflowUrl = process.env.AI_WORKFLOW_URL;
        const mockReview = process.env.MOCK_AI_REVIEW === 'true';

        if (mockReview) {
            console.log('Returning mock review for', filePath);
            return `Mock review for ${filePath}`;
        }

        if (!aiWorkflowUrl) {
            console.error('AI_WORKFLOW_URL is not defined in environment variables.');
            return 'AI review unavailable.';
        }

        try {
            const response = await axios.post<{ review: string }>(aiWorkflowUrl, { filePath });
            // Assuming the API returns a JSON object with a "review" field.
            return response.data.review || 'No review provided.';
        } catch (error) {
            console.error(`Error fetching review for ${filePath}:`, error);
            return 'Error generating review.';
        }
    }
}
