/* eslint-disable import/named, import/extensions */

import { addTempWrapper } from '../../scripts/decorate.js';
import {
  createTag,
  readBlockConfig,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

export default function decorate($block, name, doc) {
  addTempWrapper($block, 'table-of-contents');

  const config = readBlockConfig($block);
  const $headings = doc.querySelectorAll('main h2, main h3, main h4, main .table-of-contents');
  let skip = true;
  const $toc = createTag('div', { class: 'toc' });
  $headings.forEach(($h) => {
    if (!skip && $h.tagName.startsWith('H')) {
      const hLevel = +$h.tagName.substring(1);
      if (hLevel <= +config.levels + 1) {
        const $entry = createTag('div', { class: `toc-entry toc-level-h${hLevel}` });
        $entry.innerHTML = `<a href="#${$h.id}">${$h.innerHTML}</a>`;
        $toc.appendChild($entry);
      }
    }
    if ($h === $block) skip = false;
  });
  $block.innerHTML = '';
  $block.appendChild($toc);
}
