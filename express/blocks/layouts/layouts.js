import { createTag, getIconElement } from '../../scripts/utils.js';
import { Masonry } from '../shared/masonry.js';

export default function decorate($block) {
  const $layouts = Array.from($block.children);
  const layouts = [];
  $layouts.forEach(($layout) => {
    const row = Array.from($layout.children).map(($e) => $e.textContent.trim());
    const layout = {
      name: row[0],
      res: row[1],
      icon: row[2],
      link: row[3],
    };
    const sep = layout.res.includes(':') ? ':' : 'x';
    const ratios = layout.res.split(sep).map((e) => +e);
    if (ratios[1]) layout.ratio = ratios[1] / ratios[0];
    layouts.push(layout);
  });
  $block.innerHTML = '';
  const knownIcons = [
    'instagram',
    'youtube',
    'facebook',
    'twitter',
    'snapchat',
  ];
  layouts.forEach((layout) => {
    const $layout = createTag('div', {
      class: 'layout',
      style: `height: ${layout.ratio * 200}px`,
    });

    $layout.innerHTML = `<a class="layout-inside" href=${layout.link || ''}>
      <div class="layout-content">
        <div class="layout-icon"></div>  
        <div class="layout-description">${layout.name} - ${layout.res}</div>
      </div>
    </a>`;
    let { icon } = layout;
    if (knownIcons.includes(icon)) {
      icon = getIconElement(layout.icon);
    }
    $layout.querySelector('.layout-icon').append(icon);

    $block.append($layout);
  });

  const masonry = new Masonry($block, [...$block.children]);
  masonry.draw();
  window.addEventListener('resize', () => {
    masonry.draw();
  });
}
