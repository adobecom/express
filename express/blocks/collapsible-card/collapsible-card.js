import {
  createTag,
  fetchRelevantRows,
  getIconElement,
  getMobileOperatingSystem,
} from '../../scripts/utils.js';
import { addTempWrapper } from '../../scripts/utils/decorate.js';

function toggleCollapsibleCard($block) {
  $block.classList.toggle('expanded');
  $block.classList.remove('initial-expansion');
  const $divs = $block.querySelectorAll(':scope > div');
  const $childDiv = $divs[$divs.length - 1].querySelector('div');

  setTimeout(() => {
    if ($block.classList.contains('expanded')) {
      $divs[$divs.length - 1].style.maxHeight = `${$childDiv.offsetHeight}px`;
    } else {
      $divs[$divs.length - 1].style.maxHeight = '0px';
    }
  }, 100);
}

function initToggleState($block) {
  const $divs = $block.querySelectorAll(':scope > div');
  $divs[$divs.length - 1].style.maxHeight = '0px';
}

function decorateToggleButton($block) {
  const $toggleButton = createTag('div', { class: 'toggle-button' });
  $toggleButton.append(getIconElement('plus'));

  $block.prepend($toggleButton);

  $toggleButton.addEventListener('click', () => {
    toggleCollapsibleCard($block);
  });
}

function decorateBadge($block) {
  const $anchor = $block.querySelector('a');
  const OS = getMobileOperatingSystem();

  if ($anchor) {
    $anchor.textContent = '';
    $anchor.classList.add('badge');

    if (OS === 'iOS') {
      $anchor.append(getIconElement('apple-store'));
    } else {
      $anchor.append(getIconElement('google-store'));
    }
  }
}

export default async function decorate($block) {
  addTempWrapper($block, 'collapsible-card');

  if ($block.classList.contains('spreadsheet-powered')) {
    const relevantRowsData = await fetchRelevantRows(window.location.pathname);

    if (relevantRowsData && (!relevantRowsData.collapsibleCard || relevantRowsData.collapsibleCard !== 'Y')) {
      $block.remove();
    }
  }

  decorateBadge($block);
  decorateToggleButton($block);
  initToggleState($block);
}
