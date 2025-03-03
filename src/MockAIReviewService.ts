/**
 * MockAIReviewService Module
 *
 * This module provides a mock implementation for generating an AI review.
 * It returns a static review that includes detailed information for summary,
 * security, best practices, and a status field.
 */

import {AIReview} from "./types.js";

/**
 * MockAIReviewService returns a hardcoded AI review for a given file.
 */
export class MockAIReviewService {
    /**
     * Returns a mock AI review for the specified file.
     *
     * @param filePath - The relative path of the file to review.
     * @returns An AIReview object containing mock review details.
     */
    static getFileReview(filePath: string): AIReview {
        return {
            summary: `- This template provisions AWS KMS keys and aliases alongside corresponding IAM users and policies.
- It uses a list variable to handle multiple instances and leverages lifecycle settings (prevent_destroy) to protect critical resources from accidental deletion.`,
            security: `- Resource Protection:
The use of prevent_destroy in the lifecycle blocks for KMS keys, aliases, and IAM users helps safeguard these critical resources from accidental deletion.
- Policy Scoping:
The IAM user policy is mostly scoped to the specific KMS key and alias, limiting its permissions. One notable exception is the kms:GenerateRandom action, which is allowed on all resources ("*"). This action is generally considered low risk, so no significant security holes are identified.`,
            bestPractices: `- Resource Indexing:
The template uses count with list indexing (using element()) to iterate over instances. This approach can be error-prone if the order of items in the list changes. Using for_each with a map or set of unique keys is a more robust method that avoids unintentional resource replacement due to list reordering.
- IAM Policy Version:
It is recommended to include a "Version": "2012-10-17" field in the IAM policy document. This provides clarity and ensures that the policy is interpreted with the expected version semantics.
- Variable Naming:
The variable name kms-my-app-instances uses hyphens, which can be less conventional in Terraform. Consider using underscores (e.g., kms_my_app_instances) for consistency.
- Comment Clarity:
The warning about appending to the list is useful, but refactoring the resource indexing as suggested above would mitigate the risk of losing keys if the list order changes.
- Modularization:
Depending on the broader use case, consider breaking out these resources into a module for improved maintainability.`,
            status: "Ok"
        };
    }
}
