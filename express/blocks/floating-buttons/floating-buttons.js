import BlockMediator from '../../scripts/block-mediator.min.js';

function initScrollWatcher(block) {
  const hideOnIntersect = new IntersectionObserver((entries) => {
    const notIntersecting = entries.every((entry) => !entry.isIntersecting);

    if (notIntersecting) {
      block.classList.remove('hidden');
    } else {
      block.classList.add('hidden');
    }
  }, {
    root: null,
    rootMargin: '32px',
    threshold: 0,
  });

  const primaryCta = BlockMediator.get('primaryCtaUrl');

  const pageCta = document.querySelector(`.section a.primaryCTA[href='${primaryCta}']`, `.section. a.cta[href='${primaryCta}']`, `.section. a.button[href='${primaryCta}']`);
  const footer = document.querySelector('footer');

  if (pageCta) hideOnIntersect.observe(pageCta);
  if (footer) hideOnIntersect.observe(footer);
}

export default async function decorate(block) {
  const buttons = block.querySelectorAll('a');
  block.classList.add('hidden');

  buttons.forEach((btn) => {
    if (btn.parentElement.tagName === 'EM') {
      btn.classList.add('primary', 'reverse');
    }

    if (btn.parentElement.tagName === 'STRONG') {
      btn.classList.add('gradient');
    }

    if (btn.parentElement.tagName === 'DIV') {
      btn.classList.add('accent', 'cta');
    }

    btn.classList.add('button', 'xlarge');
  });

  initScrollWatcher(block);

  return block;
}
