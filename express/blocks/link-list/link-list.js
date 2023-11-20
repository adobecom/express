import {
  fetchRelevantRows,
  normalizeHeadings,
} from '../../scripts/utils.js';

import buildCarousel from '../shared/carousel.js';

async function loadSpreadsheetData($block, relevantRowsData) {
  const $default = $block.querySelector('.button-container');
  const $defaultParent = $default.parentElement;

  relevantRowsData.linkListCategories.split('\n').forEach((listData) => {
    const list = listData.split(',');
    const $list = $default.cloneNode(true);

    $list.innerHTML = $list.innerHTML.replaceAll('Default', list[0].trim());
    $list.innerHTML = $list.innerHTML.replace('/express/templates/default', list[1].trim());

    $defaultParent.append($list);
  });

  $default.remove();

  if (relevantRowsData.linkListTitle) {
    $block.innerHTML = $block.innerHTML.replaceAll('link-list-title', relevantRowsData.linkListTitle.trim());
  }
}

export default async function decorate($block) {
  if ($block.classList.contains('spreadsheet-powered')) {
    const relevantRowsData = await fetchRelevantRows(window.location.pathname);

    if (relevantRowsData && relevantRowsData.linkListCategories) {
      await loadSpreadsheetData($block, relevantRowsData);
    } else {
      $block.remove();
    }
  }

  normalizeHeadings($block, ['h3']);
  const links = [...$block.querySelectorAll('p.button-container')];
  if (links.length) {
    links.forEach((p) => {
      const link = p.querySelector('a');
      if (!$block.classList.contains('shaded')) {
        link.classList.add('secondary');
      }

      if ($block.classList.contains('shaded') && new URL(link.href).pathname === window.location.pathname) {
        link.classList.add('active');
      }

      link.classList.add('medium');
      link.classList.remove('accent');
    });
    const div = links[0].closest('div');
    const platformEl = document.createElement('div');
    platformEl.classList.add('link-list-platform');
    await buildCarousel('p.button-container', div);
    div.append(platformEl);
  }

  if (window.location.href.includes('/express/templates/')) {
    const { default: updateAsyncBlocks } = await import('../../scripts/template-ckg.js');
    await updateAsyncBlocks();
  }
}
