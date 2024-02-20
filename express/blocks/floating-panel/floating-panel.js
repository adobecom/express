import {
  lazyLoadLottiePlayer,
} from '../../scripts/utils.js';

function togglePanel(section, otherCTAs) {
  let CTAsOffBounds = 0;

  for (let i = 0; i < otherCTAs.length; i += 1) {
    const options = {
      root: document,
      rootMargin: '0px',
      threshold: 1.0,
    };

    // eslint-disable-next-line no-loop-func
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          CTAsOffBounds += 1;
          observer.disconnect();
          if (CTAsOffBounds === otherCTAs.length) {
            section.style.bottom = '0';
          } else {
            section.style.bottom = `-${section.offsetHeight}px`;
          }
        }
      });
    }, options);
    observer.observe(otherCTAs[i]);
  }
}

function initCTAWatcher(section) {
  const buttons = section.querySelectorAll('a');

  if (buttons.length > 0) {
    const ctaInBlock = buttons[buttons.length - 1];
    ctaInBlock.classList.add('floating-panel-cta');
    const otherCTAs = document.querySelectorAll(`a.button[href='${ctaInBlock.href}']:not(.floating-panel-cta)`);

    togglePanel(section, otherCTAs);

    window.addEventListener('resize', () => {
      togglePanel(section, otherCTAs);
    }, { passive: true });
  }
}

export default async function decorateBlock(block) {
  lazyLoadLottiePlayer();
  initCTAWatcher(block);
}
