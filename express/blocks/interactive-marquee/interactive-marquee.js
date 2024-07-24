import {setLibs, getLibs, createTag } from '../../scripts/utils.js';

// [headingSize, bodySize, detailSize, titlesize]
const typeSizes = ['xxl', 'xl', 'l', 'xs'];

function decorateText(el, createTag, isMwebMarquee = false) {
  const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const heading = headings[headings.length - 1];
  const config = typeSizes;
  const decorate = (headingEl, typeSize) => {
    headingEl.classList.add(`heading-${typeSize[0]}`);
    const bodyEl = headingEl.nextElementSibling;
    bodyEl?.classList.add(`body-${typeSize[1]}`);
    bodyEl?.nextElementSibling?.classList.add(`body-${typeSize[1]}`, 'pricing');
    const sib = headingEl.previousElementSibling;
    if (sib) {
      const className = sib.querySelector('img, .icon') ? 'icon-area' : `detail-${typeSize[2]}`;
      sib.classList.add(className);
      sib.previousElementSibling?.classList.add('icon-area');
    }
    const iconAreaElements = el.querySelector('.icon-area');
    const iconText = createTag('div', { class: `heading-${typeSize[3]} icon-text` });
    iconAreaElements.appendChild(iconText);
    iconAreaElements?.classList.add('icon-area');
    iconText.innerText = (iconAreaElements.textContent.trim());
    iconText.previousSibling.textContent = '';
    if (isMwebMarquee) {
      const foreground = el.closest('.foreground');
      const mwebContainer = createTag('div', { class: 'mweb-container' });
      const actionItem = el.querySelector('.action-area');
      mwebContainer.append(heading.cloneNode(true), actionItem.cloneNode(true));
      heading.classList.add('mobile-cta-top');
      actionItem.classList.add('mobile-cta-top');
      if (sib) {
        mwebContainer.prepend(sib.cloneNode(true));
        sib.classList.add('mobile-cta-top');
      }
      foreground.prepend(mwebContainer);
    }
  };
  decorate(heading, config);
}

function extendButtonsClass(text) {
  const buttons = text.querySelectorAll('.con-button');
  if (buttons.length === 0) return;
  buttons.forEach((button) => { button.classList.add('button-justified-mobile'); });
}

function interactiveInit(el, decorateButtons, decorateBlockBg, createTag) {
  const isLight = el.classList.contains('light');
  if (!isLight) el.classList.add('dark');
  const children = el.querySelectorAll(':scope > div');
  const foreground = children[children.length - 1];
  if (children.length > 1) {
    children[0].classList.add('background');
    decorateBlockBg(el, children[0], { useHandleFocalpoint: true });
  }
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
  const isMwebMarquee = el.classList.contains('mobile-cta-top');

  decorateButtons(text, 'button-xl');
  decorateText(text, createTag, isMwebMarquee);
  extendButtonsClass(text);
}



export default async function init(el) {
  const miloLibs = setLibs('/libs');
  const { decorateButtons, decorateBlockBg } = await import(`${miloLibs}/utils/decorate.js`);
  const { createTag, loadStyle } = await import(`${miloLibs}/utils/utils.js`);
  switch (true) {
    case el.classList.contains('changebg'): {
      const { default: changeBg } = await import('../../features/changeBg/changeBg.js');
      changeBg(el);
      break;
    }
    case el.classList.contains('genfill'): {
      loadStyle('/express/blocks/interactive-marquee/milo-marquee.css');
      loadStyle('/express/features/genfill/genfill-interactive.css');
      interactiveInit(el, decorateButtons, decorateBlockBg, createTag);
      const { default: decorateGenfill } = await import('../../features/genfill/genfill-interactive.js');
      await decorateGenfill(el, { createTag });
      break;
    }
    case el.classList.contains('ff-masonry'): {
      try {
        const stylePromise = new Promise((resolve) => {
          loadStyle('/express/features/firefly/firefly-masonry.css', resolve);
        });
        await stylePromise;
        interactiveInit(el, decorateButtons, decorateBlockBg, createTag);
        const { default: setMultiImageMarquee } = await import('../../features/firefly/firefly-masonry.js');
        await setMultiImageMarquee(el);
      } catch (err) {
        window.lana?.log(`Failed to load firefly masonry: ${err}`);
      }
      break;
    }
    case el.classList.contains('horizontal-masonry'): {
      loadStyle('/express/features/horizontal-masonry/horizontal-masonry.css')
      loadStyle('/express/blocks/interactive-marquee/milo-marquee.css');
      loadStyle('/express/features/interactive-elements/interactive-elements.css');
      loadStyle('/express/features/firefly/firefly-interactive.css');
      interactiveInit(el, decorateButtons, decorateBlockBg, createTag);
      const { default: setHorizontalMasonry } = await import('../../features/horizontal-masonry/horizontal-masonry.js');
      await setHorizontalMasonry (el);
      break;
    }
    case el.classList.contains('firefly'): {
      loadStyle('/express/blocks/interactive-marquee/milo-marquee.css');
      loadStyle('/express/features/interactive-elements/interactive-elements.css');
      loadStyle('/express/features/firefly/firefly-interactive.css');
      interactiveInit(el, decorateButtons, decorateBlockBg, createTag);
      const { default: setInteractiveFirefly } = await import('../../features/firefly/firefly-interactive.js');
      await setInteractiveFirefly(el);
      break;
    }
    default:
      loadStyle('/express/blocks/interactive-marquee/milo-marquee.css');
      interactiveInit(el, decorateButtons, decorateBlockBg, createTag);
      break;
  }
}
