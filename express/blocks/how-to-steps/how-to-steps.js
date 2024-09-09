/* eslint-disable import/named, import/extensions */

import {
  createTag,
  getMetadata,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

export default function decorate($block, name, doc) {
  const $howto = $block;
  const $heading = $howto.closest('.section').querySelector('h2, h3, h4');
  const $rows = Array.from($howto.children);

  const narrowWidth = getMetadata('narrow-width') === 'on';
  const container = document.querySelector('div.how-to-steps.block');
  const desktop = document.body.dataset.device === 'desktop';
  if (desktop && narrowWidth && container) {
    container.classList.add('narrow-width');
  } else if (narrowWidth && container) {
    container.classList.remove('narrow-width');
    container.classList.add('narrow-mobile-width');
  }

  const includeSchema = !$block.classList.contains('noschema');

  const schema = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: ($heading && $heading.textContent.trim()) || document.title,
    step: [],
  };

  $rows.forEach(($row, i) => {
    const $cells = Array.from($row.children);
    schema.step.push({
      '@type': 'HowToStep',
      position: i + 1,
      name: $cells[0].textContent.trim(),
      itemListElement: {
        '@type': 'HowToDirection',
        text: $cells[1].textContent.trim(),
      },
    });

    const $h3 = createTag('h3');
    $h3.innerHTML = $cells[0].textContent.trim();
    $h3.style.flex = '1';

    const $p = createTag('p');
    $p.innerHTML = $cells[1].innerHTML;

    const $headerWrapper = createTag('div', { class: 'header-wrapper' });
    $headerWrapper.style.display = 'flex';
    $headerWrapper.style.alignItems = 'center';
    $headerWrapper.style.gap = '8px';

    const $number = createTag('div', { class: 'tip-number' });
    $number.innerHTML = `<span>${i + 1}</span>`;
    $number.style.flex = 'none';

    $headerWrapper.append($number);
    $headerWrapper.append($h3);
    const $text = createTag('div', { class: 'tip-text' });
    $text.append($headerWrapper);
    $text.append($p);
    $cells[0].remove();
    $cells[1].innerHTML = '';
    $cells[1].classList.add('tip');
    if (narrowWidth && desktop) {
      $cells[1].style.maxWidth = '750px';
    } else {
      $cells[1].style.maxWidth = '600px';
    }
    $cells[1].style.margin = '0 auto';
    $cells[1].append($text);
  });

  if (includeSchema) {
    const $schema = createTag('script', { type: 'application/ld+json' });
    $schema.innerHTML = JSON.stringify(schema);
    const $head = doc.head;
    $head.append($schema);
  }
}
