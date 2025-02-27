import express from 'express';
import { createServer as createViteServer } from 'vite';
import bodyParser from 'body-parser';
import { handleWebhook } from './webhooks.js';

async function startServer() {
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
  const vite = await createViteServer();
  app.use(vite.middlewares);

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
