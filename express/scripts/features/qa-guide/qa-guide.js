import { createTag, loadStyle } from '../../utils.js';

const QA_LOG_FILE_LOCATION = '/express/qa-log';

export default function initQAGuide(el) {
  const resetQAProgress = (widget) => {
    widget.remove();
    const usp = new URLSearchParams(window.location.search);
    usp.delete('qaprogress');
    window.location.search = usp.toString();
  };

  const buildPayload = (pages) => pages.map((p) => ({
    link: p.querySelector(':scope > div:first-of-type > a, :scope > div:first-of-type').textContent.trim() || null,
    items: Array.from(p.querySelectorAll('li')).map((li) => li.textContent.trim()),
  }));

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

  const logQARecord = (form) => {
    const now = new Date(Date.now()).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
    });
    fetch(QA_LOG_FILE_LOCATION, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          timestamp: `${now} (US West)`,
          note: form.querySelector('textarea').value,
          audience: document.body.dataset?.device || 'N/A',
        },
      }),
    });
  };

  const buildQAWidget = (index, payload) => {
    loadStyle('/express/scripts/features/qa-guide/qa-guide.css');
    const progress = createTag('div', { class: 'qa-progress' }, `Page ${index + 1} / ${payload.length}`);
    const closeBtn = createTag('a', { class: 'qa-widget-close' }, '✕');
    const qaWidget = createTag('div', { class: 'qa-widget' });
    const qaWidgetForm = createTag('form', { class: 'qa-widget-form' });
    const checkboxesContainer = createTag('div', { class: 'checkboxes-container' });
    const checkboxes = [];

    const checkboxAll = createTag('input', {
      id: 'checkbox-all',
      type: 'checkbox',
      name: 'checkbox-all',
    });
    const checkboxAllLabel = createTag('label', { for: 'checkbox-all' }, 'Check all');
    const checkboxAllWrapper = createTag('div', { class: 'checkbox-all' });

    payload[index].items.forEach((item, i) => {
      const checkbox = createTag('input', {
        id: `checkbox-${i + 1}`,
        type: 'checkbox',
        name: `checkbox-${i + 1}`,
        required: true,
      });
      const checkLabel = createTag('label', { for: `checkbox-${i + 1}` }, item);
      const checkboxWrapper = createTag('div');
      checkboxWrapper.append(checkbox, checkLabel);
      checkboxesContainer.append(checkboxWrapper);
      checkboxes.push(checkbox);

      checkbox.addEventListener('change', () => {
        checkboxAll.checked = checkboxes.every((cb) => cb.checked);
      });
    });

    if (checkboxes.length) {
      checkboxAllWrapper.append(checkboxAll, checkboxAllLabel);
      qaWidgetForm.append(checkboxesContainer, checkboxAllWrapper);
    } else {
      qaWidgetForm.append(checkboxesContainer);
    }

    if (payload[index + 1]) {
      const nextBtn = createTag('button', { class: 'button', type: 'submit' }, 'Next');
      qaWidgetForm.append(nextBtn);
      qaWidgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        window.location.assign(setNextQAIndexToUrl(index + 1, new URL(payload[index + 1].link)));
      });
    } else {
      const completeBtn = createTag('button', { class: 'button', type: 'submit' }, 'Done');
      const noteArea = createTag('textarea', {
        style: 'height: 88px; width: 200px;',
        placeholder: 'Leave your notes here',
      });
      qaWidgetForm.append(noteArea, completeBtn);
      qaWidgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        logQARecord(qaWidgetForm);
        resetQAProgress(qaWidget);
      });
    }

    closeBtn.addEventListener('click', () => {
      resetQAProgress(qaWidget);
    }, { passive: true });

    qaWidget.append(closeBtn, progress, qaWidgetForm);
    document.body.append(qaWidget);

    if (checkboxes.length) {
      checkboxAll.addEventListener('change', () => {
        checkboxes.forEach((cb) => {
          cb.checked = checkboxAll.checked;
        });
      });
    }
  };

  const pages = Array.from(el.children);

  if (!pages.length) return;

  const payload = buildPayload(pages);

  const index = getQAIndex();

  if (!index && index !== 0) {
    const testPage = payload[0].link;
    if (!testPage) {
      el.textContent = 'Missing QA url(s)';
      return;
    }

    const url = new URL(testPage);
    const targetUrl = setNextQAIndexToUrl(0, url);
    window.open(targetUrl);
  } else if (!document.querySelector('.qa-widget')) {
    buildQAWidget(index, payload);
  }
}
