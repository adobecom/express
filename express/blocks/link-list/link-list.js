import {
  fetchPlaceholders,
  fetchRelevantRows,
  normalizeHeadings,
  getMetadata,
} from '../../scripts/utils.js';
import { addTempWrapper } from '../../scripts/decorate.js';

import buildCarousel from '../shared/carousel.js';

const DEFAULT_VARIANT = 'default';
const SMART_VARIANT = 'smart';

async function loadSpreadsheetData(block, relevantRowsData) {
  const defaultContainer = block.querySelector('.button-container');
  const defaultContainerParent = defaultContainer.parentElement;

  relevantRowsData.linkListCategories.split('\n').forEach((listData) => {
    const list = listData.split(',');
    const listEl = defaultContainer.cloneNode(true);

    listEl.innerHTML = listEl.innerHTML.replaceAll('Default', list[0].trim());
    listEl.innerHTML = listEl.innerHTML.replace('/express/templates/default', list[1].trim());

    defaultContainerParent.append(listEl);
  });

  defaultContainer.remove();

  if (relevantRowsData.linkListTitle) {
    block.innerHTML = block.innerHTML.replaceAll('link-list-title', relevantRowsData.linkListTitle.trim());
  }
}

const formatSmartBlockLinks = (links, baseURL) => {
  if (!links || !baseURL) return;

  let url = baseURL;
  const multipleURLs = baseURL?.replace(/\s/g, '').split(',');
  if (multipleURLs?.length > 0) {
    [url] = multipleURLs;
  } else {
    return;
  }

  const formattedURL = `${url}?acomx-dno=true&category=templates`;
  links.forEach((p) => {
    const a = p.querySelector('a');
    a.href = `${formattedURL}&q=${a.title}`;
  });
};

const toggleLinksHighlight = (links, variant) => {
  if (variant === SMART_VARIANT) return;
  links.forEach((l) => {
    const a = l.querySelector(':scope > a');
    if (a) {
      l.classList.toggle('active', a.href === window.location.href);
    }
  });
};

export default async function decorate(block) {
  let variant = DEFAULT_VARIANT;
  if (block.classList.contains(SMART_VARIANT)) {
    variant = SMART_VARIANT;
  }
  addTempWrapper(block, 'link-list');

  const narrowWidth = getMetadata('narrow-width') === 'on';
  const container = document.querySelector('div.link-list.block');
  if (narrowWidth && container) {
    container.classList.add('narrow-width');
  }

  const placeholders = await fetchPlaceholders();
  const options = {};

  if (block.classList.contains('spreadsheet-powered')) {
    const relevantRowsData = await fetchRelevantRows(window.location.pathname);

    if (relevantRowsData && relevantRowsData.linkListCategories) {
      await loadSpreadsheetData(block, relevantRowsData);
    } else {
      block.remove();
    }
  }

  if (block.classList.contains('center')) {
    options.centerAlign = true;
  }

  normalizeHeadings(block, ['h3']);
  const links = [...block.querySelectorAll('p.button-container')];
  if (links.length) {
    links.forEach((p) => {
      const link = p.querySelector('a');
      if (!block.classList.contains('shaded')) {
        link.classList.add('secondary');
      }
      link.classList.add('medium');
      link.classList.remove('accent');
    });
    const platformEl = document.createElement('div');
    platformEl.classList.add('link-list-platform');
    await buildCarousel('p.button-container', block, options);
  }

  if (block.classList.contains('shaded')) {
    toggleLinksHighlight(links, variant);
  }

  window.addEventListener('popstate', () => {
    toggleLinksHighlight(links, variant);
  });

  if (window.location.href.includes('/express/templates/')) {
    const { default: updateAsyncBlocks } = await import('../../scripts/template-ckg.js');
    await updateAsyncBlocks();
  }
  if (variant === SMART_VARIANT) {
    formatSmartBlockLinks(links, placeholders['search-branch-links']);
  }
}
