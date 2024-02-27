import { createTag, getMetadata } from '../../scripts/utils.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

function initScrollInteraction(block) {
  const inBodyBanner = block.cloneNode(true);
  inBodyBanner.dataset.blockStatus = 'loaded';
  inBodyBanner.classList.add('clone');
  block.classList.add('inbody');
  block.after(inBodyBanner);

  const intersectionCallback = (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting && inBodyBanner.getBoundingClientRect().top < 0) {
        block.classList.add('shown');
      } else {
        block.classList.remove('shown');
      }
    });
  };

  const observer = new IntersectionObserver(intersectionCallback, {
    rootMargin: '0px',
    threshold: 0,
  });

  observer.observe(inBodyBanner);
}

export default async function decorate(block) {
  const close = createTag('button', {
    class: 'close',
    'aria-label': 'close',
  });
  block.appendChild(close);

  BlockMediator.set('promobar', {
    block,
    rendered: true,
  });

  close.addEventListener('click', () => {
    block.remove();
    BlockMediator.set('promobar', {
      block,
      rendered: false,
    });
  });

  if (block.classList.contains('loadinbody')) {
    if (['yes', 'on', 'true'].includes(getMetadata('rush-beta-gating'))) {
      let resolvePromise;

      const awaitGatingResult = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const unsub = BlockMediator.subscribe('mobileBetaEligibility', (e) => {
        resolvePromise(e.newValue.deviceSupport);
        unsub();
      });

      const eligible = await awaitGatingResult;
      if (eligible) {
        block.remove();
      } else {
        setTimeout(() => {
          initScrollInteraction(block);
        });
      }
    } else {
      setTimeout(() => {
        initScrollInteraction(block);
      });
    }
  } else {
    setTimeout(() => {
      block.classList.add('shown');
    }, 10);
  }
}
