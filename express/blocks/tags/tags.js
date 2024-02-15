// eslint-disable-next-line import/no-unresolved
import { normalizeHeadings } from '../../scripts/utils.js';

/**
 * Retrieves the content of a metadata tag.
 * @param {string} name The metadata name (or property)
 * @returns {string} The metadata value
 */
export function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.head.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((el) => el.content)
    .join(', ');
  return meta;
}

function addTempWrapper($block, blockName) {
  const div = document.createElement('div');
  const parent = $block.parentElement;
  div.append($block);
  div.classList.add(`${blockName}-wrapper`);
  parent.append(div);
}

export default function decorate(block) {
  addTempWrapper(block, 'tags');

  normalizeHeadings(block, ['h3']);
  const tags = getMetadata('article:tag');
  tags.split(',').forEach((tag) => {
    if (tag) {
      const link = document.createElement('a');
      link.innerHTML = tag.trim();
      link.href = '#';
      link.classList.add('medium', 'secondary', 'button');
      block.appendChild(link);
    }
  });
}
