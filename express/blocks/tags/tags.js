// eslint-disable-next-line import/no-unresolved
import { normalizeHeadings } from '../../scripts/utils.js';
import { addTempWrapper } from '../../scripts/decorate.js';

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
