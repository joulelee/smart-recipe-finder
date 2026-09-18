# Smart Recipe Finder

## Deploy on Vercel

The included `vercel.json` explicitly builds `server.js` as a Node function and bundles the three frontend files. All routes pass through the handler's public-file allowlist. The local port listener does not run when Vercel imports the handler.

1. Push the updated `server.js` and `vercel.json` to GitHub.
2. In the Vercel project, set the Root Directory to the folder containing `package.json` and `vercel.json` (repository root for this project).
3. In Settings → Environment Variables, add `SPOONACULAR_API_KEY` with your Spoonacular key for Production and Preview as needed. Your local `.env` is deliberately not uploaded.
4. Deploy the new commit. Environment-variable changes also require a new deployment.
5. Open the new deployment URL and search. If it fails, inspect that deployment's Runtime Logs for the exception; `FUNCTION_INVOCATION_FAILED` alone does not identify a unique cause.

This project uses explicit Vercel builds, so the configuration controls function packaging rather than relying on framework auto-detection. No `npm start` command is needed on Vercel.

## Start

1. Install Node.js 22 or later.
2. Open `.env` locally and replace `replace_with_your_api_key` with your Spoonacular API key. Do not paste your key into chat or frontend files.
3. In this folder, run `npm start` (no package installation needed).
4. Open http://localhost:3000. Do not open index.html directly or use a static-only Live Server.

Restart the server after changing `.env`. Get a key from https://spoonacular.com/food-api/console.

## Files and security

- `index.html`, `style.css`, `recipe.js`: responsive browser UI.
- `server.js`: Node backend; reads `SPOONACULAR_API_KEY` from the environment and calls Spoonacular's `/recipes/complexSearch` endpoint.
- `.env`: your local secret, ignored by Git. This file is plaintext, not encrypted; keep it private.
- `.env.example`: safe configuration template without a real key.

The server serves only the three explicitly allowed frontend files. It does not expose `.env`, source configuration, or upstream error bodies. It binds to the local computer only. Before public deployment, use host-managed secrets, authentication and rate limiting to protect API quota. Never deploy this folder as a static directory.

API results include recipe images, time, servings, and original recipe links. Results are limited to 12 per search to keep this exercise small. Requests consume your Spoonacular quota. A name or ingredient query uses Spoonacular's text search, rather than a strict pantry-inventory match.

API reference: https://spoonacular.com/food-api/docs#Search-Recipes-Complex
