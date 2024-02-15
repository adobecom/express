import { normalizeHeadings } from '../../scripts/utils.js';
import buildCarousel from '../shared/carousel.js';

// category-list-wrapper's style is defined in template-list/template-list.css

function addTempWrapper($block, blockName) {
  const div = document.createElement('div');
  const parent = $block.parentElement;
  div.append($block);
  div.classList.add(`${blockName}-wrapper`);
  parent.append(div);
}

export default function decorate(block) {
  addTempWrapper(block, 'cateogry-list');

  normalizeHeadings(block, ['h3']);
  const links = [...block.querySelectorAll('p.button-container')];
  if (links.length) {
    links.forEach((p) => {
      const link = p.querySelector('a');
      link.classList.add('medium', 'secondary', 'fill');
      link.classList.remove('accent');
    });
    const div = links[0].closest('div');
    const platformEl = document.createElement('div');
    platformEl.classList.add('category-list-platform');
    buildCarousel('p.button-container', div);
    div.append(platformEl);
  }
}
