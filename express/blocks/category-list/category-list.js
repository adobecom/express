import { normalizeHeadings } from '../../utils/utils.js';
import { addTempWrapper } from '../../utils/decorate.js';
import buildCarousel from '../../components/carousel.js';

// category-list-wrapper's style is defined in template-list/template-list.css

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
