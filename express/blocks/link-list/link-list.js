import {
  fetchRelevantRows,
  normalizeHeadings,
} from '../../scripts/utils.js';
import { addTempWrapper } from '../../scripts/decorate.js';

import buildCarousel from '../shared/carousel.js';

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

export default async function decorate(block) {
  addTempWrapper(block, 'link-list');

  const options = {};
  const toggleLinksHighlight = (links) => {
    links.forEach((l) => {
      const a = l.querySelector(':scope > a');

      if (a) {
        l.classList.toggle('active', a.href === window.location.href);
      }
    });
  };

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
    toggleLinksHighlight(links);
  }

  window.addEventListener('popstate', () => {
    toggleLinksHighlight(links);
  });

  if (window.location.href.includes('/express/templates/')) {
    const { default: updateAsyncBlocks } = await import('../../scripts/template-ckg.js');
    await updateAsyncBlocks();
  }
}
