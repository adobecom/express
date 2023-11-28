import {
  createTag,
  transformLinkToAnimation,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

export default function decorate($block) {
  const $rows = Array.from($block.children);
  const $header = $rows[0].firstElementChild;
  const $container = createTag('div', { class: 'quick-action-hub-container' });
  const $listContainer = createTag('div', { class: 'quick-action-hub-list-container' });
  const $contentContainer = createTag('div', { class: 'quick-action-hub-content-container' });
  const $columns = Array.from($rows[2].children);

  $header.classList.add('quick-action-hub-header');
  $contentContainer.innerHTML = $rows[1].innerHTML;

  const $animations = $contentContainer.querySelectorAll('a');

  if ($animations) {
    $animations.forEach(($animation) => {
      if ($animation && $animation.href && $animation.href.includes('.mp4')) {
        transformLinkToAnimation($animation);
      }
    });
  }

  $columns.forEach(($column) => {
    const $columnRows = Array.from($column.children);

    $columnRows.forEach(($row) => {
      if ($row.tagName === 'P') {
        let $image = $row.querySelector('img');
        if (!$image) {
          $image = $row.querySelector('svg');
        }
        const $link = $row.querySelector('a');
        $column.append($link);
        $link.prepend($image);
        $row.remove();
      } else {
        $column.append($row);
      }
    });

    $column.classList.add('quick-action-hub-column');
    $listContainer.append($column);
  });

  $block.innerHTML = '';

  $block.append($container);
  $block.append($contentContainer);
  $container.append($header);
  $container.append($listContainer);
}
