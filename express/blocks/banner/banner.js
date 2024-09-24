import { normalizeHeadings, createTag } from '../../scripts/utils.js';

export default async function decorate(block) {
  const isBannerLightVariant = block.classList.contains('light');
  const isBannerStandoutVariant = block.classList.contains('standout');
  const isBannerCoolVariant = block.classList.contains('cool');
  const isBannerNarrowVariant = block.classList.contains('narrow');

  const addIntermediateContainer = (el, className) => {
    const intermediateContainer = createTag('div', {
      class: className,
    });

    for (const child of el.children) {
      intermediateContainer.append(child);
    }

    el.replaceChildren(intermediateContainer);
  };

  if (isBannerStandoutVariant) {
    addIntermediateContainer(block, 'standout-container');
  } else if (isBannerCoolVariant) {
    addIntermediateContainer(block, 'cool-container');
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
