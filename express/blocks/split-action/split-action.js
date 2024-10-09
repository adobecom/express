import { addTempWrapper } from '../../scripts/decorate.js';
import { createTag, getIconElement } from '../../scripts/utils.js';

function show(block) {
  const body = block.closest('body');
  const blockWrapper = block.parentNode;
  if (blockWrapper.parentElement.classList.contains('split-action-container')) {
    blockWrapper.parentElement.classList.remove('hidden');
    body.style.overflow = 'hidden';
    setTimeout(() => {
      blockWrapper.parentElement.classList.remove('transparent');
      block.style.bottom = '0';
    }, 10);
  }
}

function initCTAListener(block, href, targetBlock) {
  const buttons = targetBlock ? targetBlock.querySelectorAll('.button') : block.closest('main').querySelectorAll('.button');

  for (let i = 0; i < buttons.length; i += 1) {
    if (buttons[i].href === href && !buttons[i].classList.contains('no-event')) {
      buttons[i].addEventListener('click', (e) => {
        e.preventDefault();
        const buttonOuterWrapper = buttons[i].parentElement.parentElement;
        if (buttonOuterWrapper.classList.contains('multifunction')) {
          if (buttons[i].parentElement.classList.contains('toolbox-opened')) {
            buttonOuterWrapper.remove();
            show(block);
          }
        } else {
          show(block);
        }
      });
    }
  }
}

function initNotchDragAction(block) {
  let touchStart = 0;
  const notch = block.querySelector('.notch');

  notch.addEventListener('touchstart', (e) => {
    block.style.transition = 'none';
    touchStart = e.changedTouches[0].clientY;
  });

  notch.addEventListener('touchmove', (e) => {
    block.style.bottom = `-${e.changedTouches[0].clientY - touchStart}px`;
  });

  notch.addEventListener('touchend', (e) => {
    block.style.transition = 'bottom 0.2s';
    if (e.changedTouches[0].clientY - touchStart > 100) {
      notch.click();
    } else {
      block.style.bottom = '0';
    }
  });
}

export default function decorate(block) {
  addTempWrapper(block, 'split-action');

  block.classList.add('hidden');
  block.classList.add('transparent');

  const buttonsWrapper = createTag('div', { class: 'buttons-wrapper' });
  const blockBackground = createTag('div', { class: 'block-background' });
  const blockBody = createTag('div', { class: 'block-body' });
  const underlay = createTag('a', { class: 'underlay' });
  const notch = createTag('a', { class: 'notch' });
  const notchPill = createTag('div', { class: 'notch-pill' });

  let hrefHolder;

  block.prepend(getIconElement('adobe-express-white'));

  Array.from(block.children).forEach((div) => {
    const anchor = div.querySelector('a');

    if (anchor) {
      buttonsWrapper.append(anchor);
      div.remove();
      const buttons = document.querySelectorAll('.button.primaryCTA');
      const matchingButtons = Array.from(buttons).filter((button) => button.href === anchor.href);

      if (anchor.classList.contains('same-fcta') || matchingButtons.length > 0) {
        anchor.classList.add('no-event');
        anchor.target = '_self';
        hrefHolder = anchor.href;
      }
    }

    if (div.querySelector('picture')) {
      blockBackground.append(div.querySelector('picture'));
      div.remove();
    }
  });

  // if (!hrefHolder) {
  //   block.remove();
  //   return;
  // }

  notch.append(notchPill);
  blockBackground.append(underlay);
  block.append(blockBackground, blockBody);
  blockBody.append(notch, buttonsWrapper);

  [notch, underlay].forEach((element) => {
    element.addEventListener('click', () => {
      const actionCta = block.querySelector('.button[target="_self"]');
      window.location.href = actionCta.href;
    });
  });

  if (document.body.dataset.device === 'mobile') {
    initNotchDragAction(block);
    initCTAListener(block, hrefHolder);

    document.addEventListener('floatingbuttonloaded', (e) => {
      initCTAListener(block, hrefHolder, e.detail.block);
    });

    document.dispatchEvent(new Event('splitactionloaded'));
  }
}
