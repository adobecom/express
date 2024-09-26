import { createTag } from '../../scripts/utils.js';
import { trackButtonClick } from '../../scripts/instrument.js';

function decorateCollapsibleRows(block) {
  console.log('are we here ', block);
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
  const visibleCount = 3; // Set the number of rows to show initially
  let isExpanded = false; // Track whether the row list is expanded

  collapsibleRows.forEach((faq, index) => {
    const { header, subHeader } = faq;

    const $accordion = createTag('div', { class: 'collapsible-row-accordion' });
    if (index >= visibleCount) {
      $accordion.classList.add('collapsed'); // Initially hide extra rows
    }
    $accordion.addEventListener('click', () => {
      trackButtonClick($accordion);
    });

    block.append($accordion);

    const $headerDiv = createTag('h3', { class: 'collapsible-row-header' });
    $accordion.append($headerDiv);
    $headerDiv.innerHTML = header;

    const $subHeaderDiv = createTag('div', { class: 'collapsible-row-sub-header' });
    $accordion.append($subHeaderDiv);
    $subHeaderDiv.innerHTML = subHeader;

    entities.push({
      '@type': 'Question',
      name: header,
      acceptedAnswer: {
        '@type': 'Answer',
        text: subHeader,
      },
    });
  });

  const $toggleButton = createTag('button', { class: 'collapsible-row-toggle-btn' });
  $toggleButton.textContent = 'Show More';
  block.append($toggleButton);

  // Event listener to toggle visibility
  $toggleButton.addEventListener('click', () => {
    const hiddenItems = block.querySelectorAll('.collapsible-row-accordion');
    hiddenItems.forEach((item, index) => {
      if (index >= visibleCount) {
        item.classList.toggle('collapsed');
        item.classList.toggle('expanded');
      }
    });
    isExpanded = !isExpanded;
    $toggleButton.textContent = isExpanded ? 'Show Less' : 'Show More';
  });
}

export default async function decorate(block) {
  decorateCollapsibleRows(block);
}
