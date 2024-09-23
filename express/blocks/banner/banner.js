import { normalizeHeadings, createTag } from '../../scripts/utils.js';

export default async function decorate(block) {
  const isBannerLightVariant = block.classList.contains('light');
  const isBannerStandoutVariant = block.classList.contains('standout');
  const isBannerCoolVariant = block.classList.contains('cool');
  const isBannerNarrowVariant = block.classList.contains('narrow');

  if (isBannerStandoutVariant) {
    const standoutContainer = createTag('div', {
      class: 'standout-container',
    });

    for (const child of block.children) {
      standoutContainer.append(child);
    }

    block.replaceChildren(standoutContainer);
  }

  if (isBannerCoolVariant) {
    const coolContainer = createTag('div', {
      class: 'cool-container',
    });

    for (const child of block.children) {
      coolContainer.append(child);
    }

    block.replaceChildren(coolContainer);
  }

  if (isBannerNarrowVariant) {
    block.parentElement.style.backgroundColor = 'var(--color-info-accent)';
    block.parentElement.style.padding = '80px 15px';
  }

  if (isBannerNarrowVariant && document.body.dataset.device === 'desktop') {
    block.classList.add('desktop');
  } else {
    block.classList.remove('desktop');
  }

  normalizeHeadings(block, ['h2', 'h3']);
  const buttons = block.querySelectorAll('a.button');
  if (buttons.length > 1) {
    block.classList.add('multi-button');
  }
  // button on dark background
  buttons.forEach(($button) => {
    $button.classList.remove('primary');
    $button.classList.remove('secondary');

    if (isBannerStandoutVariant || isBannerCoolVariant) {
      $button.classList.remove('accent');
      $button.classList.add('large', 'primary');
    } else if (isBannerLightVariant) {
      $button.classList.remove('accent');
      $button.classList.add('large', 'primary', 'reverse');
    } else {
      $button.classList.add('accent', 'dark');
      if (block.classList.contains('multi-button')) {
        $button.classList.add('reverse');
      }
    }
  });

  const phoneNumberTags = block.querySelectorAll('a[title="{{business-sales-numbers}}"]');
  if (phoneNumberTags.length > 0) {
    const { formatSalesPhoneNumber } = await import('../../scripts/utils/pricing.js');
    await formatSalesPhoneNumber(phoneNumberTags);
  }
}
