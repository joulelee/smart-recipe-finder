import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

// Only these files are public. Never serve the project directory or .env.
const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/style.css', ['style.css', 'text/css']],
  ['/recipe.js', ['recipe.js', 'text/javascript']],
]);
const diets = new Set(['', 'vegetarian', 'vegan', 'gluten free', 'ketogenic']);
const key = process.env.SPOONACULAR_API_KEY?.trim();
const port = Number(process.env.PORT || 3000);

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

export const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' https: data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  try {
    if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed.' });
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/recipes') {
      const query = (url.searchParams.get('query') || '').trim();
      const diet = url.searchParams.get('diet') || '';
      const time = url.searchParams.get('maxReadyTime') || '';
      if (!query || query.length > 100 || !diets.has(diet) || !['', '15', '30', '60'].includes(time)) {
        return json(res, 400, { error: 'Enter a recipe name (up to 100 characters) and valid filters.' });
      }
      if (!key || key === 'replace_with_your_api_key') {
        return json(res, 503, { error: 'Add your Spoonacular API key to .env, then restart the server.' });
      }
      const upstream = new URL('https://api.spoonacular.com/recipes/complexSearch');
      upstream.search = new URLSearchParams({ query, number: '12', addRecipeInformation: 'true', instructionsRequired: 'true', ...(diet && { diet }), ...(time && { maxReadyTime: time }) });
      const response = await fetch(upstream, {
        headers: { 'x-api-key': key }, signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) {
        const errors = { 401: 'The API key was rejected. Check .env and restart the server.', 403: 'Spoonacular denied access. Check your API account.', 402: 'Your Spoonacular quota has been reached.', 429: 'Too many searches. Please try again shortly.' };
        return json(res, response.status === 429 ? 429 : 502, { error: errors[response.status] || 'Recipe service is unavailable. Please try again.' });
      }
      const data = await response.json();
      return json(res, 200, {
        totalResults: data.totalResults,
        results: (data.results || []).map(r => ({
          id: r.id, title: r.title, image: r.image,
          readyInMinutes: r.readyInMinutes, servings: r.servings,
          vegetarian: r.vegetarian, vegan: r.vegan,
          sourceUrl: r.sourceUrl || r.spoonacularSourceUrl,
        })),
      });
    }
    const asset = assets.get(url.pathname);
    if (!asset) return json(res, 404, { error: 'Not found.' });
    const body = await readFile(new URL(asset[0], import.meta.url));
    res.writeHead(200, { 'Content-Type': `${asset[1]}; charset=utf-8` });
    res.end(body);
  } catch {
    // Do not log upstream requests or credentials.
    json(res, 502, { error: 'Could not reach the recipe service. Please try again.' });
  }
});

server.listen(port, '127.0.0.1', () => console.log(`Smart Recipe Finder: http://localhost:${port}`));
