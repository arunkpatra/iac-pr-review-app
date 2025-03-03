import express from 'express';
import { Request, Response, NextFunction } from 'express';
// import { createServer as createViteServer } from 'vite';
import bodyParser from 'body-parser';
import { handleWebhook } from './webhooks.js';

async function startServer() {

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Optionally log and continue running, or gracefully shutdown.
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Optionally log and continue running.
  });

  const app = express();

  // Add a GET route for '/'
  app.get('/', (req, res) => {
    res.send('Ok');
  });

  // Capture raw body for signature verification
  app.use(bodyParser.json({
    verify: (req, res, buf) => {
      (req as any).rawBody = buf;
    }
  }));

  // GitHub webhook endpoint
  app.post('/webhooks/github', handleWebhook);


  // Create Vite server in middleware mode
  // const vite = await createViteServer();
  // app.use(vite.middlewares);

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Express error handler:', err);
    res.status(500).send('Internal Server Error');
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
