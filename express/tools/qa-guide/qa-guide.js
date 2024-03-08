import {
  createTag,
  loadStyle,
} from '../../utils/utils.js';

import {
  populateSessionStorage,
  updateSessionStorageChecks,
  getQAConfig,
  setQAConfig,
} from './utils/storage-controller.js';

const QA_LOG_FILE_LOCATION = '/express/qa-log';
const DEFAULT_QA_GUIDE_FILE_LOCATION = '/docs/qa-guide';

const resetQAProgress = (widget) => {
  widget.remove();
  const usp = new URLSearchParams(window.location.search);
  usp.delete('qaprogress');
  sessionStorage.removeItem('qa-record');
  window.location.search = usp.toString();
};

const getTextWithoutChild = (element) => {
  let text = '';

  for (let i = 0; i < element.childNodes.length; i += 1) {
    if (element.childNodes[i].nodeType === Node.TEXT_NODE) {
      text += element.childNodes[i].textContent;
    }
  }

  return text.trim();
};

const buildPayload = (pages) => pages.map((p) => {
  const pageLink = p.querySelector(':scope > div:first-of-type > a, :scope > div:first-of-type').innerText.trim();
  const pageUrl = new URL(pageLink);
  const targetUrl = pageUrl ? `${window.location.protocol}//${window.location.host}${pageUrl.pathname}` : pageLink;

  const pagePackage = {
    link: targetUrl || null,
    items: Array.from(p.querySelectorAll(':scope > div:last-of-type > ul > li')).map((li, idx) => {
      const item = {
        text: getTextWithoutChild(li),
        idx,
      };

      const nestedLis = li.querySelectorAll('ul > li');

      if (nestedLis?.length) {
        item.assertions = Array.from(nestedLis).map((nl) => nl.textContent.trim());
      }

      return item;
    }),
  };

  return pagePackage;
});

const getQAIndex = () => {
  const usp = new URLSearchParams(window.location.search);
  return parseInt(usp.get('qaprogress'), 10) - 1;
};

const setNextQAIndexToUrl = (index, url) => {
  const usp = new URLSearchParams(url.search);
  usp.set('qaprogress', index + 1);
  url.search = usp.toString();
  return decodeURIComponent(url.toString());
};

const logQARecord = () => {
  fetch(QA_LOG_FILE_LOCATION, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        // Let's use raw timestamp.
        // Data visualization should be handled in a different way (a separate dashboard).
        timestamp: Date.now(),
        details: sessionStorage.getItem('qa-record'),
      },
    }),
  });

  sessionStorage.removeItem('qa-record');
};

const populateCheckboxes = (qaWidgetForm, payload, index) => {
  const checkboxesContainer = createTag('div', { class: 'checkboxes-container' });
  const checkboxAll = createTag('input', {
    id: 'checkbox-all',
    type: 'checkbox',
    name: 'checkbox-all',
  });
  const checkboxAllLabel = createTag('label', { for: 'checkbox-all' }, 'Check all');
  const checkboxAllWrapper = createTag('div', { class: 'checkbox-all' });
  const checkboxes = [];

  payload[index].items.forEach((item, i) => {
    const checkbox = createTag('input', {
      id: `checkbox-${i + 1}`,
      type: 'checkbox',
      name: `checkbox-${i + 1}`,
      'data-idx': item.idx,
    });
    const checkLabel = createTag('label', { for: `checkbox-${i + 1}` }, item.text);
    const checkboxWrapper = createTag('div', { class: 'checkbox-wrapper' });
    checkboxWrapper.append(checkbox, checkLabel);
    checkboxesContainer.append(checkboxWrapper);
    checkboxes.push(checkbox);

    checkbox.addEventListener('change', () => {
      checkboxAll.checked = checkboxes.every((cb) => cb.checked);
    });

    if (item.assertions) {
      import('./utils/assertion.js').then((mod) => {
        const runAssertions = mod.default;
        runAssertions(checkbox, item);
      });
    }
  });

  if (checkboxes.length) {
    checkboxAllWrapper.append(checkboxAll, checkboxAllLabel);
    qaWidgetForm.append(checkboxesContainer, checkboxAllWrapper);
  } else {
    qaWidgetForm.append(checkboxesContainer);
  }

  if (checkboxes.length) {
    checkboxAll.addEventListener('change', () => {
      checkboxes.forEach((cb) => {
        cb.checked = checkboxAll.checked;
      });
    });
  }
};

const buildQAWidget = (index, payload) => {
  const progress = createTag('div', { class: 'qa-progress' }, `Page ${index + 1} / ${payload.length}`);
  const closeBtn = createTag('a', { class: 'qa-widget-close' }, '✕');
  const qaWidget = createTag('div', { class: 'qa-widget' });
  const qaWidgetForm = createTag('form', { class: 'qa-widget-form' });

  populateCheckboxes(qaWidgetForm, payload, index);

  const noteArea = createTag('textarea', {
    style: 'height: 88px; width: 200px;',
    placeholder: 'Leave your notes here',
  });
  qaWidgetForm.append(noteArea);

  if (payload[index + 1]) {
    const nextBtn = createTag('button', { class: 'button', type: 'submit' }, 'Next');
    qaWidgetForm.append(nextBtn);
    qaWidgetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      updateSessionStorageChecks(payload[index], qaWidgetForm);
      window.location.assign(setNextQAIndexToUrl(index + 1, new URL(payload[index + 1].link)));
    });
  } else {
    const completeBtn = createTag('button', { class: 'button', type: 'submit' }, 'Done');
    qaWidgetForm.append(completeBtn);
    qaWidgetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      updateSessionStorageChecks(payload[index], qaWidgetForm);
      logQARecord(qaWidgetForm);
      resetQAProgress(qaWidget);
    });
  }

  closeBtn.addEventListener('click', () => {
    resetQAProgress(qaWidget);
  }, { passive: true });

  qaWidget.append(closeBtn, progress, qaWidgetForm);
  document.body.append(qaWidget);
};

const loadQAStory = async (resp) => {
  const main = createTag('main');
  main.innerHTML = await resp.text();
  const qaGuideEl = main.querySelector(`.qa-guide.${document.body.dataset.device}`);

  return qaGuideEl;
};

const pauseElementsInteraction = (els = []) => {
  if (!els.length) return;
  els.forEach((el) => {
    el.disabled = true;
  });
};

const resumeElementsInteraction = (els = []) => {
  if (!els.length) return;
  els.forEach((el) => {
    el.disabled = false;
  });
};

const launchStorySelector = async () => {
  const selector = createTag('div');
  const heading = createTag('h3', { class: 'story-selector-heading' }, 'QA Story Selector');
  const description = createTag('p', { class: 'story-selector-description' }, 'Use the input below to specify a QA guide doc source to launch a custom QA Guide.');
  const input = createTag('input', { class: 'story-selector-input', placeholder: `default: ${DEFAULT_QA_GUIDE_FILE_LOCATION}` });
  const loadCta = createTag('button', { class: 'story-selector-load-btn', disabled: true }, 'Load');
  const useDefaultCta = createTag('button', { class: 'story-selector-load-default-btn' }, 'Use Default');
  const errorMsg = createTag('div', { class: 'story-selector-error' });

  selector.append(heading, description, input, loadCta, useDefaultCta, errorMsg);

  loadCta.addEventListener('click', async () => {
    pauseElementsInteraction([input, loadCta, useDefaultCta]);
    const resp = await fetch(`${input.value}.plain.html`);
    resumeElementsInteraction([input, loadCta, useDefaultCta]);
    if (!resp.ok) {
      errorMsg.textContent = 'Invalid file location. Please check your input.';
    } else {
      sessionStorage.removeItem('qa-record');
      setQAConfig('story', input.value);
      const qaGuideEl = await loadQAStory(resp);

      const pages = Array.from(qaGuideEl.children);

      if (!pages.length) return;

      const payload = buildPayload(pages);

      populateSessionStorage(payload);
      const testPage = payload[0].link;
      if (!testPage) {
        qaGuideEl.textContent = 'Missing QA url(s)';
        return;
      }

      const url = new URL(testPage);
      const targetUrl = setNextQAIndexToUrl(0, url);
      window.open(targetUrl);
    }
  });

  useDefaultCta.addEventListener('click', async () => {
    pauseElementsInteraction([input, loadCta, useDefaultCta]);
    const resp = await fetch(`${DEFAULT_QA_GUIDE_FILE_LOCATION}.plain.html`);
    resumeElementsInteraction([input, loadCta, useDefaultCta]);
    if (!resp.ok) return;

    sessionStorage.removeItem('qa-record');
    setQAConfig('story', DEFAULT_QA_GUIDE_FILE_LOCATION);
    const qaGuideEl = await loadQAStory(resp);

    const pages = Array.from(qaGuideEl.children);

    if (!pages.length) return;

    const payload = buildPayload(pages);

    populateSessionStorage(payload);
    const testPage = payload[0].link;
    if (!testPage) {
      qaGuideEl.textContent = 'Missing QA url(s)';
      return;
    }

    const url = new URL(testPage);
    const targetUrl = setNextQAIndexToUrl(0, url);
    window.open(targetUrl);
  });

  input.addEventListener('input', () => {
    errorMsg.textContent = '';
    loadCta.disabled = input.value === '';
  });

  const mod = await import('../../blocks/modal/modal.js');
  mod.getModal(null, {
    class: 'qa-guide-story-selector', id: 'qa-guide-story-selector', content: selector, closeEvent: 'close:qa-guide-story-selector',
  });
};

export default async function initQAGuide() {
  loadStyle('/express/scripts/features/qa-guide/qa-guide.css');
  const index = getQAIndex();

  if (!index && index !== 0) {
    launchStorySelector();
  } else if (!document.querySelector('.qa-widget')) {
    const resp = await fetch(`${getQAConfig('story') || DEFAULT_QA_GUIDE_FILE_LOCATION}.plain.html`);
    if (!resp.ok) return;

    const qaGuideEl = await loadQAStory(resp);
    const pages = Array.from(qaGuideEl.children);

    if (!pages.length) return;

    const payload = buildPayload(pages);
    buildQAWidget(index, payload);
  }
}
