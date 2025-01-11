import { createTag } from '../../scripts/utils.js';

function buildTableLayout(block) {
  const parentDiv = block.closest('.section.section-wrapper');
  parentDiv?.classList.add('longformv2', 'longformv2-section-padding');

  const rows = Array.from(block.children);
  block.innerHTML = '';
  const background = rows.shift();
  background.classList.add('longformv2-background');
  parentDiv.prepend(background);
  const headerText = rows.shift()?.innerText.trim();

  if (headerText) {
    const rowAccordionHeader = createTag('h2', { class: 'collapsible-row-accordion title' });
    rowAccordionHeader.textContent = headerText;
    block.prepend(rowAccordionHeader);
  }

  const collapsibleRows = [];
  rows.forEach((row) => {
    const cells = Array.from(row.children);
    const header = cells[0];
    const subHeader = cells[1];
    collapsibleRows.push({
      header: header.textContent.trim(),
      subHeader: subHeader.innerHTML,
    });
  });

  collapsibleRows.forEach((row) => {
    const { header, subHeader } = row;

    const rowWrapper = createTag('div', { class: 'collapsible-row-wrapper' });
    block.append(rowWrapper);

    const headerAccordion = createTag('div', { class: 'collapsible-row-accordion expandable header-accordion' });
    rowWrapper.append(headerAccordion);

    const headerDiv = createTag('h3', { class: 'collapsible-row-header expandable' });
    headerDiv.innerHTML = header;
    headerAccordion.append(headerDiv);

    const iconElement = createTag('img', {
      src: '/express/icons/plus-heavy.svg',
      alt: 'toggle-icon',
      class: 'toggle-icon',
    });

    headerDiv.appendChild(iconElement);

    const subHeaderAccordion = createTag('div', { class: 'collapsible-row-accordion expandable sub-header-accordion' });
    rowWrapper.append(subHeaderAccordion);

    const subHeaderDiv = createTag('div', { class: 'collapsible-row-sub-header expandable' });
    subHeaderDiv.innerHTML = subHeader;
    subHeaderAccordion.append(subHeaderDiv);

    headerDiv.addEventListener('click', () => {
      headerAccordion.classList.toggle('rounded-corners');
      const isCollapsed = subHeaderAccordion.classList.toggle('collapsed');
      subHeaderAccordion.style.display = isCollapsed ? 'flex' : 'none';
      subHeaderAccordion.style.paddingTop = 0;

      iconElement.src = isCollapsed ? '/express/icons/minus-heavy.svg' : '/express/icons/plus-heavy.svg';
    });
  });
}

export default async function decorate(block) {
  console.log('we are here', block);
  buildTableLayout(block);
}
