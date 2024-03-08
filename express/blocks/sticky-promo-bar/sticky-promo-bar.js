import { createTag, getMetadata } from '../../utils/utils.js';
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
    if (['yes', 'on', 'true'].includes(getMetadata('rush-beta-gating')) && ['yes', 'true', 'on'].includes(getMetadata('mobile-benchmark').toLowerCase()) && document.body.dataset.device === 'mobile') {
      const eligibility = BlockMediator.get('mobileBetaEligibility');
      if (eligibility) {
        if (eligibility.deviceSupport) {
          block.remove();
          return;
        }
      } else {
        const eligible = await new Promise((resolve) => {
          const unsub = BlockMediator.subscribe('mobileBetaEligibility', (e) => {
            resolve(e.newValue.deviceSupport);
            unsub();
          });
        });

        if (eligible) {
          block.remove();
          return;
        }
      }
    }

    setTimeout(() => {
      initScrollInteraction(block);
    });
  } else {
    setTimeout(() => {
      block.classList.add('shown');
    }, 10);
  }
}
