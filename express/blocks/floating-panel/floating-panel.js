// no block wrapper dependency
import {
  lazyLoadLottiePlayer,
  getIconElement,
  getLottie,
  createTag,
  fetchBlockFragDecorated,
  fixIcons,
  fetchPlaceholders,
  getConfig,
} from '../../scripts/utils.js';

function initObserver(elem, observeTargets) {
  const hideOnIntersect = new IntersectionObserver((entries) => {
    const notIntersecting = entries.every((entry) => !entry.isIntersecting);

    if (notIntersecting) {
      elem.classList.remove('hidden');
    } else {
      elem.classList.add('hidden');
      elem.classList.remove('expanded');
    }
  }, {
    root: null,
    rootMargin: '32px',
    threshold: 0,
  });

  observeTargets.forEach((t) => {
    if (t) hideOnIntersect.observe(t);
  });
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
        btn.prepend(getIconElement('premium-crown-white'));
      }

      parentEl.parentElement.replaceChild(btn, parentEl);
    } else {
      btn.classList.add('accent', 'cta');
    }

    btn.classList.add('button', 'xlarge');

    const sameHrefButtonsOnPage = Array.from(document.querySelectorAll('a')).filter((b) => btn !== b && b.href === btn.href);
    initObserver(btn, sameHrefButtonsOnPage);
  });
}

async function buildTimeline(props) {
  const today = new Date();
  const ietf = getConfig().locale.ietf || 'en-US';
  const placeholders = await fetchPlaceholders();
  const timeline = createTag('div', { class: 'timeline' });
  const todayWrapper = createTag('div', { class: 'time-wrapper time-today' }, getIconElement('premium'));
  const reminderDayWrapper = createTag('div', { class: 'time-wrapper time-reminder' }, getIconElement('bell-white'));
  const endDayWrapper = createTag('div', { class: 'time-wrapper time-end' }, getIconElement('clock-white'));

  [todayWrapper, reminderDayWrapper, endDayWrapper].forEach((w, i) => {
    const textWrapper = createTag('p', { class: 'text-wrapper' });
    const statusWrapper = createTag('p', { class: 'status-wrapper' });
    w.append(textWrapper, statusWrapper);

    if (i === 0) {
      textWrapper.textContent = placeholders.today || 'Today';
      statusWrapper.textContent = placeholders['full-access'] || 'Full access';
    }

    if (i === 1 && props.trialTimeline[0]) {
      const reminderDate = new Date(
        new Date().setDate(today.getDate() + parseInt(props.trialTimeline[0], 10)),
      );
      textWrapper.textContent = reminderDate.toLocaleDateString(ietf);
      statusWrapper.textContent = placeholders['reminder-email'] || 'Reminder email';
    }

    if (i === 2 && props.trialTimeline[1]) {
      const endDate = new Date(
        new Date().setDate(today.getDate() + parseInt(props.trialTimeline[1], 10)),
      );
      textWrapper.textContent = endDate.toLocaleDateString(ietf);
      statusWrapper.textContent = placeholders['free-trial-ends'] || 'Free trial ends';
    }

    timeline.append(w);
  });

  return timeline;
}

function initBlockInteraction(block, props) {
  const topContainer = createTag('div', { class: 'top-container' });
  const closeButton = createTag('a', { class: 'close-panel-button' }, getIconElement('close-white'));
  let timeline;
  topContainer.prepend(closeButton);
  block.prepend(topContainer);

  block.addEventListener('mouseenter', async () => {
    if (!timeline) {
      timeline = await buildTimeline(props);
      const contentRow = block.querySelector('.content-container');
      contentRow.after(timeline);
    }

    if (!props.panelFragment) {
      props.panelFragment = await fetchBlockFragDecorated(props.panelFragmentUrl.pathname, 'columns');
      const columnsBlock = props.panelFragment.querySelector('.columns.block');

      if (columnsBlock) {
        await fixIcons(columnsBlock);
        const columnInnerDiv = columnsBlock.querySelector(':scope > div');

        if (columnInnerDiv) {
          topContainer.append(columnInnerDiv);
        }
      }
    }

    if (!block.classList.contains('hidden')) block.classList.add('expanded');
  });

  closeButton.addEventListener(('click'), () => {
    block.classList.remove('expanded');
  }, { passive: true });

  block.addEventListener('mouseleave', async () => {
    block.classList.remove('expanded');
  });

  const buttons = block.querySelectorAll('a.button');
  const config = { attributes: true, childList: false, subtree: false };
  const buttonsObj = {};

  const observer = new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const btn = mutation.target;
        buttonsObj[btn] = !btn.classList.contains('hidden');
      }
    }

    const allButtonsHidden = Object.values(buttonsObj).every((v) => !v);

    if (allButtonsHidden) {
      block.classList.add('hidden');
      block.classList.remove('expanded');
    } else {
      block.classList.remove('hidden');
    }
  });

  buttons.forEach((btn) => {
    buttonsObj[btn] = true;
    observer.observe(btn, config);
  });

  const footer = document.querySelector('footer');
  initObserver(block, [footer]);
}

export default async function decorate(block) {
  const props = {};
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
      const buttons = innerCol.querySelectorAll('a');
      decorateButtons(buttons);

      bottomCont.append(innerCol);
    }

    if (index === 2) {
      props.panelFragmentUrl = new URL(row.querySelector('a:any-link')?.href);
      row.remove();
    }

    if (index === 3) {
      const cols = row.querySelectorAll(':scope > div');

      const [key, val] = cols;

      if (key?.textContent.trim().toLowerCase() === 'trial-timeline') {
        const [reminder, end] = val.textContent.replaceAll(' ', '').split(',');
        props.trialTimeline = [reminder, end];
      }

      row.remove();
    }
  });

  block.append(bottomCont);

  initBlockInteraction(block, props);
}
