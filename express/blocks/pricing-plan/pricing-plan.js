import { createTag } from '../../utils/utils.js';

function decoratePricingPlan($block) {
  const blockContent = $block.firstElementChild.innerHTML;
  $block.innerHTML = '';
  const $gradientBorder = createTag('div', { class: 'gradient-border' });
  $block.append($gradientBorder);
  const $innerRectangle = createTag('div', { class: 'inner-rectangle' });
  $gradientBorder.append($innerRectangle);
  $innerRectangle.innerHTML = blockContent;
  const paragraphs = Array.from($innerRectangle.querySelectorAll('p'));
  const prices = paragraphs.filter((p) => /\$/.test(p.innerHTML));
  prices.forEach(($price) => {
    $price.classList.add('price');
  });
}

export default function decorate($block) {
  decoratePricingPlan($block);
}
