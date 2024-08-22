import { setLibs } from '../../scripts/utils.js';

// [headingSize, bodySize, detailSize, titlesize]
const typeSizes = ['xxl', 'xl', 'l', 'xs'];

function decorateText(el) {
  const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const heading = headings[headings.length - 1];
  const config = typeSizes;
  const decorate = (headingEl, typeSize) => {
    headingEl.classList.add(`heading-${typeSize[0]}`);
    const bodyEl = headingEl.nextElementSibling;
    bodyEl?.classList.add(`body-${typeSize[1]}`);
    bodyEl?.nextElementSibling?.classList.add(`body-${typeSize[1]}`);
  };
  decorate(heading, config);
}

function extendButtonsClass(text) {
  const buttons = text.querySelectorAll('.con-button');
  if (buttons.length === 0) return;
  buttons.forEach((button) => {
    button.classList.add('button-justified-mobile');
  });
}

function interactiveInit(el, decorateButtons, createTag) {
  const isLight = el.classList.contains('light');
  if (!isLight) el.classList.add('dark');
  const children = el.querySelectorAll(':scope > div');
  const foreground = children[children.length - 1];
  foreground.classList.add('foreground', 'container');
  const headline = foreground.querySelector('h1, h2, h3, h4, h5, h6');
  const text = headline.closest('div');
  text.classList.add('text');
  const mediaElements = foreground.querySelectorAll(':scope > div:not([class])');
  const media = mediaElements[0];
  if (media) {
    const interactiveBox = createTag('div', { class: 'interactive-container' });
    mediaElements.forEach((mediaDiv) => {
      mediaDiv.classList.add('asset');
      interactiveBox.appendChild(mediaDiv);
    });
    foreground.appendChild(interactiveBox);
  }

  const firstDivInForeground = foreground.querySelector(':scope > div');
  if (firstDivInForeground?.classList.contains('asset')) el.classList.add('row-reversed');
  decorateButtons(text, 'button-xl');
  decorateText(text, createTag);
  extendButtonsClass(text);
}

export default async function init(el) {
  const miloLibs = setLibs('/libs');
  const { decorateButtons } = await import(`${miloLibs}/utils/decorate.js`);
  const { createTag, loadStyle } = await import(`${miloLibs}/utils/utils.js`);
  if (!el.classList.contains('horizontal-masonry')) {
    window.lana?.log('Using interactive-marquee on Express requires using the horizontal-masonry class.');
    return;
  }
  loadStyle('/express/features/horizontal-masonry/horizontal-masonry.css');
  loadStyle('/express/blocks/interactive-marquee/milo-marquee.css');
  interactiveInit(el, decorateButtons, createTag);
  const { default: setHorizontalMasonry } = await import('../../features/horizontal-masonry/horizontal-masonry.js');
  await setHorizontalMasonry(el);
}
