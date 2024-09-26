import { createTag } from '../../scripts/utils.js';
import { trackButtonClick } from '../../scripts/instrument.js';

function decorateCollapsibleRows(block) {
  const collapsibleRows = [];
  const entities = [];
  const rows = Array.from(block.children);
  rows.forEach((row) => {
    const cells = Array.from(row.children);
    const header = cells[0];
    const subHeader = cells[1];
    collapsibleRows.push({
      header: header.textContent.trim(),
      subHeader: subHeader.innerHTML,
    });
  });

  block.innerHTML = '';
  const visibleCount = 3;
  let isExpanded = false;

  collapsibleRows.forEach((row, index) => {
    const { header, subHeader } = row;

    const accordion = createTag('div', { class: 'collapsible-row-accordion' });
    if (index >= visibleCount) {
      accordion.classList.add('collapsed');
    }
    accordion.addEventListener('click', () => {
      trackButtonClick(accordion);
    });

    block.append(accordion);

    const headerDiv = createTag('h3', { class: 'collapsible-row-header' });
    accordion.append(headerDiv);
    headerDiv.innerHTML = header;

    const subHeaderDiv = createTag('div', { class: 'collapsible-row-sub-header' });
    accordion.append(subHeaderDiv);
    subHeaderDiv.innerHTML = subHeader;

    entities.push({
      '@type': 'Header',
      name: header,
      acceptedAnswer: {
        '@type': 'SubHeader',
        text: subHeader,
      },
    });
  });

  const toggleButton = createTag('button', { class: 'collapsible-row-toggle-btn' });
  toggleButton.textContent = 'Show More';
  block.append(toggleButton);

  toggleButton.addEventListener('click', () => {
    const hiddenItems = block.querySelectorAll('.collapsible-row-accordion');
    hiddenItems.forEach((item, index) => {
      if (index >= visibleCount) {
        item.classList.toggle('collapsed');
        item.classList.toggle('expanded');
      }
    });
    isExpanded = !isExpanded;
    toggleButton.textContent = isExpanded ? 'Show Less' : 'Show More';
  });
}

export default async function decorate(block) {
  decorateCollapsibleRows(block);
}
