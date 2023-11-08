import { normalizeHeadings } from '../../scripts/utils.js';
import buildCarousel from '../shared/carousel.js';

export default function decorate(block) {
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
