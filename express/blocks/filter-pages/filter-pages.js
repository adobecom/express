/* eslint-disable import/named, import/extensions */

import {
  createTag,
  readBlockConfig,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

import {
  addPublishDependencies
} from '../../scripts/franklin-utils.js';

function filterMigratedPages(filter) {
  const $results = document.getElementById('page-filter-results');
  const $stats = document.getElementById('page-filter-stats');
  $results.innerHTML = '';
  const index = window.fullIndex;
  let counter = 0;
  if (index) {
    index.forEach((page) => {
      if (page.path.includes(filter)) {
        counter += 1;
        let { path } = page;
        if (!path.startsWith(' ')) path = path.substr(1);
        path = path.replace('.html', '');
        let markedUpPath = path;
        if (filter) markedUpPath = path.split(filter).join(`<b>${filter}</b>`);
        const $card = createTag('div', { class: 'card' });
        $card.innerHTML = `<div class="card-image">
            <img loading="lazy" src="${page.image}">
          </div>
          <div class="card-body">
            <h3>${page.title}</h3>
            <p>${markedUpPath}</p>
          </div>`;
        $card.addEventListener('click', () => {
          window.location.href = path;
        });
        $results.appendChild($card);
      }
    });
  }
  $stats.innerHTML = `${counter} page${counter !== 1 ? 's' : ''} found`;
}

async function fetchFullIndex(indices) {
  const fullIndex = [];

  await Promise.all(indices.map(async (url) => {
    if (url) {
      try {
        const resp = await fetch(url);
        const json = await resp.json();
        // eslint-disable-next-line no-console
        console.log(`${url}: ${json.data.length}`);
        fullIndex.push(...json.data.filter((e) => !!e.path));
      } catch (e) {
        // something went wrong
      }
    }
  }));
  fullIndex.forEach((e) => {
    if (e.path.startsWith('/make') || e.path.startsWith('/templates')) {
      e.path = ` ${e.path}`;
    }
    fullIndex.sort((e1, e2) => e1.path.localeCompare(e2.path));
  });
  return (fullIndex);
}

async function decorateFilterPages($filterPages) {
  const config = readBlockConfig($filterPages);

  $filterPages.innerHTML = `<input type="text" id="page-filter" placeholder="type to filter" />
    <div class="stats" id="page-filter-stats"></div>
    <div class="results" id="page-filter-results"></div>`;

  const $pageFilter = document.getElementById('page-filter');
  $pageFilter.addEventListener('keyup', () => {
    filterMigratedPages($pageFilter.value);
  });

  const indices = config.indices.split('.json').map((e) => (e ? `${e}.json` : undefined));
  addPublishDependencies(indices);
  window.fullIndex = await fetchFullIndex(indices);

  filterMigratedPages($pageFilter.value);
}

export default function decorate($block) {
  decorateFilterPages($block);
}
