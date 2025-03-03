/**
 * GitHub Webhook Handler Module
 *
 * This module handles incoming GitHub webhook events by:
 *  - Verifying the webhook signature.
 *  - Creating the appropriate PR service instance using the PRServiceFactory.
 *  - Delegating pull request events to the PRHandler for asynchronous processing.
 *  - Immediately acknowledging the webhook receipt.
 *
 * Note: Errors during event processing are logged without terminating the server.
 */

import 'dotenv/config';
import { Request, Response} from 'express';
import crypto from 'crypto';
import { PRHandler } from './PRHandler.js';
import { PRServiceFactory } from './PRServiceFactory.js';

/**
 * Webhook secret loaded from environment variables.
 * Used for verifying incoming webhook payload signatures.
 */
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

/**
 * Verifies the signature of the incoming webhook request.
 *
 * This function computes the HMAC digest of the raw request body using the
 * configured WEBHOOK_SECRET and compares it against the signature provided in
 * the 'x-hub-signature-256' header.
 *
 * @param req - The incoming Express request.
 * @throws An error if the signature header is missing or if the computed digest does not match.
 */
function verifySignature(req: Request): void {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) {
    throw new Error('Missing X-Hub-Signature-256 header');
  }
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update((req as any).rawBody);
  const digest = `sha256=${hmac.digest('hex')}`;
  if (signature !== digest) {
    throw new Error('Invalid signature');
  }
}

/**
 * Handles incoming GitHub webhook events.
 *
 * This function verifies the webhook signature and then processes pull_request events.
 * It uses the PRServiceFactory to create a GitHub PR service instance. The response is sent
 * immediately to acknowledge receipt of the webhook, while the event is processed asynchronously.
 *
 * @param req - The incoming webhook request.
 * @param res - The Express response object.
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  try {
    // Verify the webhook signature.
    verifySignature(req);

    // Extract the GitHub event type from the headers.
    const event = req.headers['x-github-event'];
    console.log(`Received GitHub event: ${event}`);

    if (event === 'pull_request') {
      const payload = req.body;
      const installationId = payload.installation.id;
      const owner = payload.repository.owner.login;
      const repo = payload.repository.name;

      // Create a GitHub PR service instance using the factory.
      const githubService = PRServiceFactory.createService(
          'github',
          { token: '' }, // Token is dynamically fetched by the service.
          { owner, repo, installationId }
      );

      // Immediately acknowledge the webhook.
      res.status(200).send('Webhook received');

      // Process the pull_request event asynchronously.
      PRHandler.handlePullRequestEvent(payload, githubService)
          .then(() => {
            console.log(`Processed pull_request event for repo: ${owner}/${repo}`);
          })
          .catch((err: Error) => {
            console.error('Error processing webhook event:', err);
          });
      return;
    }

    // For non-pull_request events, simply respond with an acknowledgment.
    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).send('Error processing webhook');
  }
}
