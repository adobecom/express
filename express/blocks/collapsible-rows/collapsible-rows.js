import { createTag } from '../../scripts/utils.js';

function decorateCollapsibleRows(block) {
  const collapsibleRows = [];
  const rows = Array.from(block.children);

  block.closest('.section.section-wrapper')?.classList.add('reduce-padding-top');

  const isOneLineCollapseVariant = block.classList.contains('one-line-collapse');
  isOneLineCollapseVariant && block.closest('.section.section-wrapper')?.classList.add('grey-bg');

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

    if (!isOneLineCollapseVariant && index >= visibleCount) {
      accordion.classList.add('collapsed');
      accordion.style.display = 'none';
    }

    block.append(accordion);

    const headerDiv = createTag('h3', { class: 'collapsible-row-header' });
    accordion.append(headerDiv);
    headerDiv.innerHTML = header;

    const subHeaderDiv = createTag('div', { class: 'collapsible-row-sub-header' });
    subHeaderDiv.innerHTML = subHeader;

    if (isOneLineCollapseVariant) {
      subHeaderDiv.style.display = 'none';

      const headerIconWrapper = createTag('div', { class: 'header-icon-wrapper' });
      headerDiv.classList.add('header-icon');

      const iconElement = createTag('img', {
        src: '/express/icons/plus-heavy.svg',
        alt: 'toggle-icon',
        class: 'toggle-icon',
      });

      headerIconWrapper.append(headerDiv, iconElement);

      accordion.append(headerIconWrapper);

      accordion.append(subHeaderDiv);

      iconElement.addEventListener('click', () => {
        const isCollapsed = subHeaderDiv.style.display === 'none';
        subHeaderDiv.style.display = isCollapsed ? 'block' : 'none';

        iconElement.src = isCollapsed
          ? '/express/icons/minus-heavy.svg'
          : '/express/icons/plus-heavy.svg';
      });
    } else {
      accordion.append(subHeaderDiv);
    }
  });

  if (!isOneLineCollapseVariant) {
    const toggleButton = createTag('a', { class: 'collapsible-row-toggle-btn button' });
    toggleButton.textContent = 'View more';
    block.append(toggleButton);

    toggleButton.addEventListener('click', () => {
      const hiddenItems = block.querySelectorAll('.collapsible-row-accordion');
      hiddenItems.forEach((item, index) => {
        if (index >= visibleCount) {
          if (item.classList.contains('collapsed')) {
            item.classList.remove('collapsed');
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
            item.classList.add('collapsed');
          }
        }
      });
      isExpanded = !isExpanded;
      toggleButton.textContent = isExpanded ? 'View less' : 'View more';
    });
  }
}

export default async function decorate(block) {
  decorateCollapsibleRows(block);
}
