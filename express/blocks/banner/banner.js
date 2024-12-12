import { normalizeHeadings, createTag } from '../../scripts/utils.js';

export default async function decorate(block) {
  const isBannerLightVariant = block.classList.contains('light');
  const isBannerStandoutVariant = block.classList.contains('standout');
  const isBannerCoolVariant = block.classList.contains('cool');
  const isBannerNarrowVariant = block.classList.contains('narrow');

  const bgImgURL = block.children[0]?.querySelector('img')?.src;

  const header = block.querySelector('h2');
  if (header) {
    const headerParent = header.parentElement;
    if (bgImgURL) {
      const firstChild = block.children[0];
      if (firstChild) {
        block.removeChild(firstChild);
      }
      headerParent.classList.add('bg-img-container');
      headerParent.style.backgroundImage = `url(${bgImgURL})`;
    }
  }

  if (isBannerStandoutVariant || isBannerCoolVariant) {
    const contentContainer = createTag('div', {
      class: 'content-container',
    });
    for (const child of block.children) {
      contentContainer.append(child);
    }
    block.replaceChildren(contentContainer);
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
