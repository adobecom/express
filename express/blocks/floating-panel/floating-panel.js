// no block wrapper dependency
import BlockMediator from '../../scripts/block-mediator.min.js';
import {
  lazyLoadLottiePlayer,
  getIconElement,
  getLottie,
  createTag,
  fetchPlainBlockFromFragment,
  fixIcons,
  fetchPlaceholders,
  getConfig,
} from '../../scripts/utils.js';

let panelFragmentUrl;
let panelFragment;

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

function decorateButtons(buttons) {
  buttons.forEach((btn) => {
    const parentEl = btn.parentElement;

    if (['EM', 'STRONG'].includes(parentEl.tagName)) {
      if (parentEl.tagName === 'EM') {
        btn.classList.add('primary', 'reverse', 'dark');
        btn.classList.remove('light');
      }

      if (parentEl.tagName === 'STRONG') {
        btn.classList.add('gradient');
        btn.prepend(getIconElement('premium'));
      }

      parentEl.parentElement.replaceChild(btn, parentEl);
    } else {
      btn.classList.add('accent', 'cta');
    }

    btn.classList.add('button', 'xlarge');
  });
}

async function buildTimeline() {
  const today = new Date();
  const ietf = getConfig().locale.ietf || 'en-US';
  const placeholders = await fetchPlaceholders();
  const timeline = createTag('div', { class: 'timeline' });
  const todayWrapper = createTag('div', { class: 'time-wrapper time-today' }, getIconElement('premium'));
  const reminderDayWrapper = createTag('div', { class: 'time-wrapper time-reminder' }, getIconElement('clock-white'));
  const endDayWrapper = createTag('div', { class: 'time-wrapper time-end' }, getIconElement('clock-white'));

  [todayWrapper, reminderDayWrapper, endDayWrapper].forEach((w, i) => {
    const textWrapper = createTag('p', { class: 'text-wrapper' });
    const statusWrapper = createTag('p', { class: 'status-wrapper' });
    w.append(textWrapper, statusWrapper);

    if (i === 0) {
      textWrapper.textContent = placeholders.today || 'Today';
      statusWrapper.textContent = placeholders['full-access'] || 'Full access';
    }

    if (i === 1) {
      const reminderDate = new Date(new Date().setDate(today.getDate() + 23));
      textWrapper.textContent = reminderDate.toLocaleDateString(ietf);
      statusWrapper.textContent = placeholders['reminder-email'] || 'Reminder email';
    }

    if (i === 2) {
      const endDate = new Date(new Date().setDate(today.getDate() + 30));
      textWrapper.textContent = endDate.toLocaleDateString(ietf);
      statusWrapper.textContent = placeholders['free-trial-ends'] || 'Free trial ends';
    }

    timeline.append(w);
  });

  return timeline;
}

export default async function decorateBlock(block) {
  const bottomCont = createTag('div', { class: 'bottom-container' });
  lazyLoadLottiePlayer();
  Array.from(block.children).forEach((row, index) => {
    if (index === 0) {
      row.classList.add('content-container');
      const toggleButton = createTag('a', { class: 'toggle-button' });
      toggleButton.innerHTML = getLottie('plus-animation', '/express/icons/plus-animation.json');
      const toggleIcon = getIconElement('plus-heavy');
      toggleButton.append(toggleIcon);
      row.prepend(toggleButton);
      bottomCont.append(row);
    }

    if (index === 1) {
      const innerCol = row.querySelector(':scope > div');
      if (innerCol) innerCol.classList.add('buttons-wrapper');
      block.replaceChild(innerCol, row);
      const buttons = innerCol.querySelectorAll('a.button');
      decorateButtons(buttons);

      bottomCont.append(innerCol);
    }

    if (index === 2) {
      panelFragmentUrl = new URL(row.querySelector('a:any-link')?.href);
      row.remove();
    }
  });

  block.append(bottomCont);
  initScrollWatcher(block);

  const topContainer = createTag('div', { class: 'top-container' });
  const closeButton = createTag('a', { class: 'close-panel-button' }, getIconElement('close-white'));
  topContainer.prepend(closeButton);
  block.prepend(topContainer);

  block.addEventListener('mouseenter', async () => {
    if (!panelFragment) {
      const timeline = await buildTimeline();
      const contentRow = block.querySelector('.content-container');
      contentRow.after(timeline);

      panelFragment = await fetchPlainBlockFromFragment(panelFragmentUrl.pathname, 'columns');
      const columnsBlock = panelFragment.querySelector('.columns.block');

      if (columnsBlock) {
        await fixIcons(columnsBlock);
        const columnInnerDiv = columnsBlock.querySelector(':scope > div');

        if (columnInnerDiv) {
          topContainer.append(columnInnerDiv);
        }
      }
    }

    block.classList.add('expanded');
  });

  closeButton.addEventListener(('click'), () => {
    block.classList.remove('expanded');
  }, { passive: true });

  block.addEventListener('mouseleave', async () => {
    block.classList.remove('expanded');
  });
}
