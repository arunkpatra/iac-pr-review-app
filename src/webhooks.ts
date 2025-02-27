import 'dotenv/config';
import { Request, Response } from 'express';
import crypto from 'crypto';
import { GitHubPRService } from './GitHubPRService.js';
import { InstallationTokenManager } from './InstallationTokenManager.js';

// Use your webhook secret from environment variables.
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

function verifySignature(req: Request): void {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) {
    throw new Error('Missing X-Hub-Signature-256 header');
  }
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update((req as any).rawBody);
  const digest = `sha256=${hmac.digest('hex')}`;
  console.log(`Webhook Secret: ${WEBHOOK_SECRET}`)
  console.log(`Signature: ${signature}`)
  console.log(`Digest: ${digest}`)
  if (signature !== digest) {
    throw new Error('Invalid signature');
  }
}

export async function handleWebhook(req: Request, res: Response) {
  try {
    // Verify the signature.
    verifySignature(req);

    const event = req.headers['x-github-event'];
    console.log(`Received GitHub event: ${event}`);

    // Example: Handle pull_request events
    if (event === 'pull_request') {
      const payload = req.body;
      // Extract installation, repository, and PR info.
      const installationId = payload.installation.id;
      const owner = payload.repository.owner.login;
      const repo = payload.repository.name;

      // Instantiate the token manager and GitHub service.
      const tokenManager = new InstallationTokenManager();
      const githubService = new GitHubPRService(
        { token: '' }, // token will be fetched dynamically
        owner,
        repo,
        installationId,
        tokenManager
      );

      // Add your logic here – for example, post a comment when a PR is opened.
      // if (payload.action === 'opened') {
      //   const comment = {
      //     prId: payload.pull_request.number.toString(),
      //     filePath: 'src/example.js',
      //     lineNumber: 10,
      //     comment: 'Thanks for opening this PR!'
      //   };
      //   await githubService.postReviewComment(comment);
      // }
      console.log('Processed pull_request event for repo:', `${owner}/${repo}`);
    }

    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).send('Error processing webhook');
  }
}

