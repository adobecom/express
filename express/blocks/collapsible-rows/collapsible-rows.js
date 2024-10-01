import { createTag } from '../../scripts/utils.js';

// function buildTableLayout(block) {
//   block.closest('.section.section-wrapper')?.classList.add('grey-bg', 'reduce-padding-top');

//   const collapsibleRows = [];
//   const rows = Array.from(block.children);
//   const headerElement = rows.shift();

//   rows.forEach((row) => {
//     const cells = Array.from(row.children);
//     const header = cells[0];
//     const subHeader = cells[1];
//     collapsibleRows.push({
//       header: header.textContent.trim(),
//       subHeader: subHeader.innerHTML,
//     });
//   });

//   block.innerHTML = '';

//   const table = createTag('table', { class: 'collapsible-table' });

//   if (headerElement) {
//     const thead = createTag('thead');
//     const headerRow = createTag('tr');
//     const headerCell = createTag('th', { colspan: '2' });
//     headerCell.innerHTML = headerElement.innerHTML;
//     headerRow.append(headerCell);
//     thead.append(headerRow);
//     table.append(thead);
//   }

//   collapsibleRows.forEach((row) => {
//     const { header, subHeader } = row;

//     const labelBody = createTag('tbody', { class: 'labels' });
//     const contentBody = createTag('tbody', { class: 'collapsible-content hide' });

//     const labelRow = createTag('tr');
//     const labelCell = createTag('td', { colspan: '2' });
//     const labelDiv = createTag('div', { class: 'header-icon-wrapper' });

//     const labelHeader = createTag('div', { class: 'collapsible-row-header' });
//     labelHeader.textContent = header;

//     const iconElement = createTag('img', {
//       src: '/express/icons/plus-heavy.svg',
//       alt: 'toggle-icon',
//       class: 'toggle-icon',
//     });

//     labelDiv.append(labelHeader, iconElement);
//     labelCell.append(labelDiv);
//     labelRow.append(labelCell);
//     labelBody.append(labelRow);

//     const subHeaderRow = createTag('tr');
//     const subHeaderCell = createTag('td', { colspan: '2' });
//     subHeaderCell.innerHTML = subHeader;
//     subHeaderRow.append(subHeaderCell);
//     contentBody.append(subHeaderRow);

//     table.append(labelBody);
//     table.append(contentBody);

//     labelDiv.addEventListener('click', () => {
//       const isCollapsed = contentBody.classList.contains('hide');
//       contentBody.classList.toggle('hide', !isCollapsed);
//       iconElement.src = isCollapsed
//         ? '/express/icons/minus-heavy.svg'
//         : '/express/icons/plus-heavy.svg';
//     });
//   });

//   block.append(table);
// }

function buildOriginalLayout(block) {
  const collapsibleRows = [];
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
      accordion.style.display = 'none';
    }

    block.append(accordion);

    const headerDiv = createTag('h3', { class: 'collapsible-row-header' });
    accordion.append(headerDiv);
    headerDiv.innerHTML = header;

    const subHeaderDiv = createTag('div', { class: 'collapsible-row-sub-header' });
    subHeaderDiv.innerHTML = subHeader;
    accordion.append(subHeaderDiv);
  });

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

function buildOriginalLayout2(block) {
  const collapsibleRows = [];
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
  const isExpanded = false;

  collapsibleRows.forEach((row, index) => {
    const { header, subHeader } = row;

    const accordion = createTag('div', { class: 'collapsible-row-accordion' });

    if (index >= visibleCount) {
      accordion.classList.add('collapsed');
      accordion.style.display = 'none';
    }

    block.append(accordion);

    const headerDiv = createTag('h3', { class: 'collapsible-row-header' });
    accordion.append(headerDiv);
    headerDiv.innerHTML = header;

    const subHeaderDiv = createTag('div', { class: 'collapsible-row-sub-header' });
    subHeaderDiv.innerHTML = subHeader;
    accordion.append(subHeaderDiv);
  });

  const hiddenItems = block.querySelectorAll('.collapsible-row-accordion');
  hiddenItems.forEach((item, index) => {
    item.classList.remove('collapsed');
    item.style.display = 'flex';
  });
  console.log('hiddenItems', hiddenItems);

  // const toggleButton = createTag('a', { class: 'collapsible-row-toggle-btn button' });
  // toggleButton.textContent = 'View more';
  // block.append(toggleButton);

  // toggleButton.addEventListener('click', () => {
  //   const hiddenItems = block.querySelectorAll('.collapsible-row-accordion');
  //   hiddenItems.forEach((item, index) => {
  //     if (index >= visibleCount) {
  //       if (item.classList.contains('collapsed')) {
  //         item.classList.remove('collapsed');
  //         item.style.display = 'flex';
  //       } else {
  //         item.style.display = 'none';
  //         item.classList.add('collapsed');
  //       }
  //     }
  //   });
  //   isExpanded = !isExpanded;
  //   toggleButton.textContent = isExpanded ? 'View less' : 'View more';
  // });
}

export default async function decorate(block) {
  // const isOneLineCollapseVariant = block.classList.contains('one-line-collapse');
  const isExpandable = block.classList.contains('expandable');
  console.log('isExpandable', isExpandable);

  if (isExpandable) {
    // buildTableLayout(block);
    buildOriginalLayout2(block);
  } else {
    buildOriginalLayout(block);
  }
}
