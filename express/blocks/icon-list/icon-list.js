import {
  toClassName,
  addBlockClasses,
  createTag,
  getIconElement,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';
import { addTempWrapper } from '../../scripts/decorate.js';

export default function decorate($block) {
  addTempWrapper($block, 'icon-list');

  let numCols = 0;
  const $rows = [...$block.children];
  if ($rows[0]) {
    numCols = $rows[0].children.length;
  }
  if (numCols === 2) {
    /* legacy icon list */
    addBlockClasses($block, ['icon-list-image', 'icon-list-description']);
    $block.querySelectorAll(':scope>div').forEach(($row) => {
      if ($row.children && $row.children[1] && !$row.querySelector('img, svg')) {
        const iconName = toClassName($row.children[0].textContent.trim());
        if (iconName && !iconName.startsWith('-')) {
          $row.children[0].textContent = '';
          $row.children[0].append(getIconElement(iconName) || '');
        }
      }
    });
  }

  if (numCols === 4) {
    const $cols = ['left', 'right'].map(() => createTag('div', { class: 'icon-list-column' }));
    $rows.forEach(($row, i) => {
      $cols.forEach(($col) => $col.append(createTag('div')));
      const $cells = [...$row.children];
      $cells.forEach(($cell, j) => {
        $cols[Math.floor(j / 2)].children[i].append($cell);
        if (j % 2) {
          if ($cell.querySelector('h3')) {
            $cell.parentNode.classList.add('icon-list-heading');
          } else {
            $cell.parentNode.classList.add('icon-list-regular');
          }
        }
      });
      $row.remove();
    });
    $cols.forEach(($col) => {
      addBlockClasses($col, ['icon-list-image', 'icon-list-description']);
      $block.append($col);
    });
    $block.classList.add('two-column');
    $block.closest('div.section').classList.add('icon-list-two-column-container');
  }
}
