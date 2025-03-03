/**
 * ReviewFormatter Module
 *
 * This module provides a method to convert an AIReview object into a formatted Markdown string.
 */

import {AIReview} from "./types.js";

export class ReviewFormatter {
    /**
     * Formats an AIReview object into a Markdown string.
     *
     * @param review - The AIReview object containing review details.
     * @returns A Markdown string representing the review.
     */
    static formatReview(review: AIReview): string {
        return `### File Review

**Summary:**  
${review.summary}

**Security:**  
${review.security}

**Best Practices:**  
${review.bestPractices}`;
    }
}
