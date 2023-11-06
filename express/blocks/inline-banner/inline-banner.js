import {
  normalizeHeadings,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

export default function decorate($block) {
  normalizeHeadings($block, ['h2', 'h3', 'h4']);
  const $section = $block.closest('main .section');
  if ($section
    && ($section.className.includes('dark') || $section.className.includes('highlight'))) {
    // force inverted style
    $block.classList.add('inverted');
    $block.querySelectorAll('a.button').forEach(($btn) => {
      // buttons must be primary + light
      $btn.className = 'button primary light';
    });
  }
}
