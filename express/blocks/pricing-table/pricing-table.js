import { createTag, fetchPlaceholders, yieldToMain } from '../../scripts/utils.js';
import { debounce } from '../../scripts/hofs.js';
import { decorateButtons } from '../../scripts/utils/decorate.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

const plans = ['monthly', 'yearly']; // authored order should match with billing-radio
const BILLING_PLAN = 'billing-plan';

const MOBILE_SIZE = 981;
function defineDeviceByScreenSize() {
  const screenWidth = window.innerWidth;
  if (screenWidth >= MOBILE_SIZE) return 'DESKTOP';
  return 'MOBILE';
}

function handleToggleMore(e) {
  const sectionHead = e.closest('.row');
  let prevElement = sectionHead.previousElementSibling;
  const expanded = e.getAttribute('aria-expanded') === 'false';
  e.setAttribute('aria-expanded', expanded.toString());
  while (prevElement && !prevElement.classList.contains('section-header-row') && !prevElement.classList.contains('spacer-row')) {
    if (expanded) {
      sectionHead.classList.remove('collapsed');
      prevElement.classList.remove('collapsed');
    } else {
      sectionHead.classList.add('collapsed');
      prevElement.classList.add('collapsed');
    }
    prevElement = prevElement.previousElementSibling;
  }
}

function handleHeading(headingRow) {
  const headingCols = Array.from(headingRow.children);
  if (headingCols.length > 3) headingRow.parentElement.classList.add('many-cols');
  else if (headingCols.length < 3) headingRow.parentElement.classList.add('few-cols');

  headingCols.forEach((col) => {
    col.classList.add('col-heading');
    if (!col.innerHTML) {
      col.classList.add('hidden');
      return;
    }
    const elements = col.children;
    if (!elements.length) {
      col.innerHTML = `<p class="tracking-header">${col.innerHTML}</p>`;
    } else {
      decorateButtons(col, 'button-l');
      const buttonsWrapper = createTag('div', { class: 'buttons-wrapper' });
      col.append(buttonsWrapper);
      const buttons = col.querySelectorAll('.button');

      buttons.forEach((btn) => {
        if (btn.classList.contains('con-button', 'blue')) {
          btn.classList.add('primary');
          btn.parentNode.remove();
        }
        const btnWrapper = btn.closest('P');
        buttonsWrapper.append(btnWrapper);
      });

      if (buttons.length > 1) {
        buttons.forEach((btn, index) => {
          btn.classList.add(plans[index]);
        });
        const reactToPlanChange = ({ newValue }) => {
          buttons.forEach((btn) => {
            if (btn.classList.contains(plans[newValue])) {
              btn.classList.remove('hide');
            } else {
              btn.classList.add('hide');
            }
          });
        };
        reactToPlanChange({ newValue: BlockMediator.get(BILLING_PLAN) ?? 0 });
        BlockMediator.subscribe(BILLING_PLAN, reactToPlanChange);
      }

      const div = document.createElement('div');
      const colLabel = document.createElement('div');
      colLabel.classList.add('col-heading');
      [...elements].forEach((e) => {
        if (!e.classList.contains('buttons-wrapper')) colLabel.append(e.cloneNode(true));
        div.append(e);
      });
      col.innerHTML = '';
      col.append(div);
      const colIndex = col.getAttribute('data-col-index');
      const colItems = headingRow.parentElement.querySelectorAll(`.section-row > .col[data-col-index="${colIndex}"]`);
      colItems.forEach((colItem) => {
        const colWrapper = document.createElement('div');
        colWrapper.classList.add('col-wrapper');
        const colContent = document.createElement('div');
        colContent.classList.add('col-content');
        colWrapper.append(colLabel.cloneNode(true), colContent);
        Array.from(colItem.children).forEach((colItemEl) => {
          colContent.appendChild(colItemEl);
        });
        colItem.append(colWrapper);
      });
    }
  });
}

const EXCLUDE_ICON = '<span class="feat-icon dash"></span>';
const INCLUDE_ICON = '<span class="feat-icon check"></span>';

function handleSection(sectionParams) {
  const {
    row,
    index,
    allRows,
    rowCols,
    isToggle,
  } = sectionParams;

  const previousRow = allRows[index - 1];
  const nextRow = allRows[index + 1];
  if (!nextRow) row.classList.add('table-end-row');
  if (rowCols.length === 0) {
    row.classList.add('blank-row');
    row.removeAttribute('role');
    if (index > 0) previousRow.classList.add('table-end-row');
    if (nextRow) nextRow.classList.add('table-start-row');
  } else if (isToggle) {
    const toggleIconTag = createTag('span', { class: 'icon expand', 'aria-expanded': 'false', role: 'button' });

    row.querySelector('.toggle-content').prepend(toggleIconTag);
    row.classList.add('collapsed');
    let prevRow = previousRow;
    let i = index;
    // TODO: clean up this func please...
    while (prevRow && !prevRow.classList.contains('section-header-row') && !prevRow.classList.contains('blank-row')) {
      prevRow.classList.add('collapsed');
      i -= 1;
      prevRow = allRows[i].previousElementSibling;
    }
  } else if (rowCols.length === 1) {
    row.classList.add('section-header-row');
    rowCols[0].classList.add('section-head-title');
    rowCols[0].setAttribute('role', 'rowheader');
  } else if (index === 0) {
    row.classList.add('row-heading', 'table-start-row');
  } else {
    row.classList.add('section-row');
    rowCols.forEach((col, idx) => {
      if (idx === 0) {
        if (!col.children?.length || col.querySelector(':scope > sup')) col.innerHTML = `<p>${col.innerHTML}</p>`;
        return;
      }
      const child = col.children?.[0] || col;
      if (!child.innerHTML || child.innerHTML === '-') {
        col.classList.add('excluded-feature');
        child.innerHTML = EXCLUDE_ICON;
      } else if (child.innerHTML === '+') {
        col.classList.add('included-feature');
        child.innerHTML = INCLUDE_ICON;
      } else if (!col.children.length) {
        child.innerHTML = `<p>${col.innerHTML}</p>`;
      }
    });
    if (nextRow.classList.contains('toggle-row') && nextRow.classList.contains('desktop-hide')) row.classList.add('table-end-row');
  }
}

const assignEvents = (tableEl) => {
  tableEl.querySelectorAll('.icon.expand').forEach((icon) => {
    icon.parentElement.classList.add('point-cursor');
    const row = icon.closest('.row');
    row.addEventListener('click', () => handleToggleMore(icon));
    row.addEventListener('keydown', (e) => {
      e.preventDefault();
      if (e.key === 'Enter' || e.key === ' ') handleToggleMore(icon);
    });
  });
};

// multiple live on same page
const getId = (function idSetups() {
  const gen = (function* g() {
    let id = 0;
    while (true) {
      yield id;
      id += 1;
    }
  }());
  return () => gen.next().value;
}());

export default async function init(el) {
  const blockId = getId();
  el.id = `pricing-table-${blockId + 1}`;
  el.setAttribute('role', 'table');
  const visibleCount = parseInt(Array.from(el.classList).find((c) => /^show(\d+)/i.test(c))?.substring(4) ?? '3', 10);
  const rows = Array.from(el.children);
  let sectionItem = 0;
  const placeholders = await fetchPlaceholders();
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    row.classList.add('row', `row-${index + 1}`);
    row.setAttribute('role', 'row');
    const cols = Array.from(row.children);

    let isAdditional = false;
    const isToggle = row.classList.contains('toggle-row');

    if (!isToggle) {
      if (cols.length <= 1) {
        if (!cols[0]?.innerHTML) {
          cols.shift().remove();
        } else {
          sectionItem = 0;
        }
      }
      if (sectionItem > visibleCount) isAdditional = true;
      sectionItem += 1;
      cols.forEach((col, cdx) => {
        col.dataset.colIndex = cdx + 1;
        col.classList.add('col', `col-${cdx + 1}`);
        col.setAttribute('role', 'cell');
        if (col.innerHTML) col.tabIndex = 0;
      });
      if (sectionItem % 2 === 0 && cols.length > 1) row.classList.add('shaded');
    }

    const nextRow = rows[index + 1];
    if (index > 0 && !isToggle && cols.length > 1
      && (!nextRow || Array.from(nextRow.children).length <= 1)) {
      const toggleRow = createTag('div', { class: 'toggle-row', tabIndex: 0 });
      if (!isAdditional) toggleRow.classList.add('desktop-hide');

      const viewAllText = placeholders['view-all-features'] ?? 'View all features';
      const toggleOverflowContent = createTag('div', { class: 'toggle-content col', role: 'cell', 'aria-label': viewAllText }, viewAllText);
      toggleRow.append(toggleOverflowContent);

      if (nextRow) {
        rows.splice(index + 1, 0, toggleRow);
        el.insertBefore(toggleRow, nextRow);
      } else {
        rows.push(toggleRow);
        el.append(toggleRow);
      }
    }
    if (isAdditional && cols.length > 1) row.classList.add('additional-row');
    const sectionParams = {
      row,
      index,
      allRows: rows,
      rowCols: cols,
      isToggle,
    };
    handleSection(sectionParams);
    // eslint-disable-next-line no-await-in-loop
    if (index % 2 === 0 && index < rows.length - 1) await yieldToMain();
  }

  handleHeading(rows[0]);
  assignEvents(el);

  const handleResize = () => {
    const collapisbleRows = el.querySelectorAll('.section-row, .toggle-row');
    collapisbleRows.forEach((collapisbleRow) => {
      collapisbleRow.classList.add('collapsed');
    });
    const toggleRows = el.querySelectorAll('.toggle-row');
    toggleRows.forEach((toggleRow) => {
      toggleRow.querySelector('.icon.expand').setAttribute('aria-expanded', false);
    });
  };
  let deviceBySize = defineDeviceByScreenSize();
  window.addEventListener('resize', debounce(() => {
    if (deviceBySize === defineDeviceByScreenSize()) return;
    deviceBySize = defineDeviceByScreenSize();
    handleResize();
  }, 100));

  if (el.classList.contains('sticky')) {
    const scrollHandler = () => {
      if (deviceBySize === 'MOBILE') return;
      if (el.closest('div.tabpanel')?.getAttribute('hidden')) {
        return;
      }
      const gnav = document.querySelector('header');
      const gnavHeight = gnav.offsetHeight;
      const { top } = rows[0].getBoundingClientRect();
      if (top <= gnavHeight && !rows[0].classList.contains('stuck')) {
        rows[0].classList.add('stuck');
        rows[0].style.top = `${gnavHeight}px`;
      } else if (rows[0].classList.contains('stuck') && top > gnavHeight) {
        rows[0].classList.remove('stuck');
      }
    };
    window.addEventListener('scroll', debounce(scrollHandler, 30), { passive: true });
  }
}
