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
  let process = false;

  headings.forEach((h) => {
    if (h === block) {
      process = true;
    }
    if (process && h.tagName.startsWith('H')) {
      const hLevel = +h.tagName.substring(1);
      if (hLevel <= +config.levels + 1) {
        const entry = createTag('div', { class: `toc-entry toc-level-h${hLevel}` });
        entry.innerHTML = `<a href="#${h.id}">${h.innerHTML}</a>`;
        toc.appendChild(entry);
      }
    }
  });
  block.innerHTML = '';
  block.appendChild(toc);
}
