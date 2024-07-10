import { createTag } from '../../scripts/utils.js';

export default function decorate($block, name, doc) {
  const $howto = $block;
  const $heading = $howto.closest('.section').querySelector('h2, h3, h4');
  const $rows = Array.from($howto.children);
  const includeSchema = !$block.classList.contains('noschema');
  const isInlineTip = $block.classList.contains('inline-tip');

  const schema = createSchema($heading, document.title);
  const startNumber = getStartNumber($block);

  $rows.forEach(($row, i) => {
    const $cells = Array.from($row.children);
    updateSchema(schema, $cells, i);
    decorateRow($cells, i, startNumber, isInlineTip);
  });

  if (includeSchema) {
    appendSchema(schema, doc);
  }
}

function createSchema(heading, documentTitle) {
  return {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: (heading && heading.textContent.trim()) || documentTitle,
    step: [],
  };
}

function getStartNumber($block) {
  const numberClass = Array.from($block.classList).find(className => parseInt(className) > 0);
  return numberClass ? parseInt(numberClass) : 0;
}

function updateSchema(schema, $cells, index) {
  schema.step.push({
    '@type': 'HowToStep',
    position: index + 1,
    name: $cells[0].textContent.trim(),
    itemListElement: {
      '@type': 'HowToDirection',
      text: $cells[1].textContent.trim(),
    },
  });
}

function decorateRow($cells, index, startNumber, isInlineTip) {
  const $h3 = createTag('h3', {}, $cells[0].textContent.trim());
  const $p = createTag('p', {}, $cells[1].innerHTML);
  const $text = createTag('div', { class: 'tip-text' }, [$p]);
  const $number = createTag('div', { class: 'tip-number' }, `<span>${index + 1 + startNumber}</span>`);

  if (isInlineTip) {
    const $numberWrapper = createTag('div', { class: 'inline-tip-wrapper' }, [$number, $h3]);
    $cells[1].innerHTML = '';
    $cells[1].classList.add('tip');
    $cells[1].append($numberWrapper, $text);
  } else {
    $text.prepend($h3);
    $cells[1].innerHTML = '';
    $cells[1].classList.add('tip');
    $cells[1].append($number, $text);
  }

  $cells[0].remove();
}

function appendSchema(schema, doc) {
  const $schema = createTag('script', { type: 'application/ld+json' }, JSON.stringify(schema));
  doc.head.append($schema);
}