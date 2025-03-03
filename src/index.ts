/**
 * Server Entry Point
 *
 * This module initializes and starts the Express server. It:
 * - Registers global error handlers for uncaught exceptions and unhandled promise rejections.
 * - Configures middleware and routes (including a health-check and GitHub webhook endpoint).
 * - Registers an Express error-handling middleware.
 *
 * To run the server, simply execute this file.
 */

import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import { handleWebhook } from './githubWebhookHandler.js';

/**
 * Registers global process error handlers.
 * Catches uncaught exceptions and unhandled promise rejections to prevent the server from crashing.
 */
function registerGlobalErrorHandlers(): void {
  process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught Exception:', err);
    // Optionally, log error details and notify monitoring services.
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Optionally, log error details and notify monitoring services.
  });
}

/**
 * Configures Express middleware and application routes.
 *
 * @param app - The Express application instance.
 */
function setupExpress(app: express.Application): void {
  // Health check route.
  app.get('/', (req: Request, res: Response) => {
    res.send('Ok');
  });

  // Use body-parser middleware to parse JSON and capture raw body (for signature verification).
  app.use(bodyParser.json({
    verify: (req: Request, res: Response, buf: Buffer) => {
      (req as any).rawBody = buf;
    }
  }));

  // GitHub webhook endpoint.
  app.post('/webhooks/github', handleWebhook);
}

/**
 * Registers a centralized error-handling middleware for Express.
 *
 * This middleware catches errors from any preceding middleware or routes and sends a 500 response.
 *
 * @param app - The Express application instance.
 */
function registerErrorMiddleware(app: express.Application): void {
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Express error handler:', err);
    res.status(500).send('Internal Server Error');
  });
}

/**
 * Initializes and starts the Express server.
 */
async function startServer(): Promise<void> {
  // Register global process-level error handlers.
  registerGlobalErrorHandlers();

  // Create the Express app.
  const app = express();

  // Configure middleware and routes.
  setupExpress(app);

  // Register error-handling middleware.
  registerErrorMiddleware(app);

  // Start listening on the configured port.
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

// Start the server and log any initialization errors.
startServer().catch((err: Error) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
