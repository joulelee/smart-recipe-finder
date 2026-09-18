const form = document.querySelector('#search-form');
const results = document.querySelector('#results');
const status = document.querySelector('#status');
const count = document.querySelector('#result-count');
const button = document.querySelector('#search-button');
let activeRequest;

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

function safeUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; }
  catch { return null; }
}

function recipeCard(recipe) {
  const card = element('article', 'recipe-card');
  const imageUrl = safeUrl(recipe.image);
  if (imageUrl) {
    const image = element('img', '');
    image.src = imageUrl;
    image.alt = recipe.title;
    image.loading = 'lazy';
    image.addEventListener('error', () => image.remove(), { once: true });
    card.append(image);
  }
  const body = element('div', 'card-body');
  const badges = element('div', 'badges');
  badges.append(element('span', 'badge', recipe.vegan ? 'Plant based' : recipe.vegetarian ? 'Vegetarian' : 'Recipe inspiration'));
  // Spoonacular's readyInMinutes includes preparation and cooking time.
  const minutes = Number(recipe.readyInMinutes);
  if (Number.isFinite(minutes) && minutes > 0 && minutes <= 30) {
    const quick = element('span', 'quick-badge', 'Quick Meal');
    quick.title = 'Ready in 30 minutes or less';
    quick.setAttribute('aria-label', 'Quick Meal: ready in 30 minutes or less');
    badges.append(quick);
  }
  body.append(badges);
  body.append(element('h3', '', recipe.title));
  const details = [];
  if (recipe.readyInMinutes > 0) details.push(`${recipe.readyInMinutes} min`);
  if (recipe.servings > 0) details.push(`${recipe.servings} servings`);
  body.append(element('p', 'meta', details.join(' · ')));
  const source = safeUrl(recipe.sourceUrl);
  if (source) {
    const link = element('a', '', 'View recipe ↗');
    link.href = source;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `View recipe: ${recipe.title}`);
    body.append(link);
  }
  card.append(body);
  return card;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const query = form.elements.query.value.trim();
  if (!query) { form.elements.query.focus(); return; }
  activeRequest?.abort();
  const controller = new AbortController();
  activeRequest = controller;
  button.disabled = true;
  button.textContent = 'Finding recipes…';
  results.setAttribute('aria-busy', 'true');
  results.replaceChildren();
  count.textContent = '';
  status.className = '';
  status.textContent = 'Looking for something delicious…';
  const params = new URLSearchParams(new FormData(form));
  params.set('query', query);
  try {
    // This calls our backend; the secret never enters the browser.
    const response = await fetch(`/api/recipes?${params}`, { signal: controller.signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Search failed. Please try again.');
    const recipes = data.results || [];
    results.replaceChildren(...recipes.map(recipeCard));
    count.textContent = `${recipes.length} of ${data.totalResults ?? recipes.length} recipes`;
    status.textContent = recipes.length ? '' : 'No recipes found. Try another ingredient or relax your filters.';
  } catch (error) {
    if (error.name === 'AbortError') return;
    status.className = 'error';
    status.textContent = error instanceof TypeError ? 'Cannot connect. Check that the server is running and try again.' : error.message;
  } finally {
    if (activeRequest === controller) {
      button.disabled = false;
      button.textContent = 'Find recipes ↗';
      results.setAttribute('aria-busy', 'false');
    }
  }
});

document.querySelectorAll('[data-query]').forEach(chip => {
  chip.addEventListener('click', () => {
    form.elements.query.value = chip.dataset.query;
    form.requestSubmit();
  });
});
