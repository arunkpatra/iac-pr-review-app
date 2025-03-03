# IAC PR Review App

**iac-pr-review-app** is a multi-tenant pull request review application designed for GitHub (with plans to support GitLab in the future). It receives webhook events from GitHub, processes pull request events, and posts file-level review comments—updating existing comments when possible. The app also caches GitHub App installation tokens and uses Prisma ORM with a PostgreSQL database (containerized via Docker Compose) to persist metadata about review comments.


### Run Locally

```shell
npm run build && npm run start
```

App will be available at http://localhost:3000

Start Ngrok

```shell
ngrok http 3000
```

Use the Forwarding address (e.g https://5289-106-51-207-57.ngrok-free.app) in the GitHub app's webhook configuration.

Then create a PR. Comments would be added to appropriate files in the PR at the top.
