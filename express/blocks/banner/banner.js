import { normalizeHeadings, createTag } from '../../scripts/utils.js';

export default async function decorate(block) {
  const isBannerLightVariant = block.classList.contains('light');
  const isBannerStandoutVariant = block.classList.contains('standout');

  if (isBannerStandoutVariant) {
    const standoutContainer = createTag('div', {
      class: "standout-container"
    });

    for (const child of block.children) {
      standoutContainer.append(child)
    }

    block.replaceChildren(standoutContainer);

    const arrBoldText = [...standoutContainer.querySelectorAll(":scope strong")];

    for (const el of arrBoldText) {
      el.classList.add("standout-text")
    }
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

    if (isBannerStandoutVariant) {
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
