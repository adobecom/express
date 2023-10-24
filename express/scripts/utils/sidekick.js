/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

function initQAGuide(el, utils) {
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
    fetch('/express/qa-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          timestamp: `${now} (US West)`,
          note: form.querySelector('textarea').value,
        },
      }),
    });
  };

  const buildQAWidget = (index, payload) => {
    const progress = utils.createTag('div', { class: 'qa-progress' }, `Page ${index + 1} / ${payload.length}`);
    const closeBtn = utils.createTag('a', { class: 'qa-widget-close' }, '✕');
    const qaWidget = utils.createTag('div', { class: 'qa-widget' });
    const qaWidgetForm = utils.createTag('form', { class: 'qa-widget-form' });
    const checkboxesContainer = utils.createTag('div', { class: 'checkboxes-container' });
    const checkboxes = [];

    payload[index].items.forEach((item, i) => {
      const checkbox = utils.createTag('input', {
        id: `checkbox-${i + 1}`,
        type: 'checkbox',
        name: `checkbox-${i + 1}`,
        required: true,
      });
      const checkLabel = utils.createTag('label', { for: `checkbox-${i + 1}` }, item);
      const checkboxWrapper = utils.createTag('div');
      checkboxWrapper.append(checkbox, checkLabel);
      checkboxesContainer.append(checkboxWrapper);
      checkboxes.push(checkbox);
    });

    const checkboxAll = utils.createTag('input', {
      id: 'checkbox-all',
      type: 'checkbox',
      name: 'checkbox-all',
    });
    const checkLabel = utils.createTag('label', { for: 'checkbox-all' }, 'Check all');
    const checkboxWrapper = utils.createTag('div', { class: 'checkbox-all' });
    checkboxWrapper.append(checkboxAll, checkLabel);
    checkboxesContainer.append(checkboxWrapper);

    qaWidgetForm.append(checkboxesContainer);

    if (payload[index + 1]) {
      const nextBtn = utils.createTag('button', { class: 'button', type: 'submit' }, 'Next');
      qaWidgetForm.append(nextBtn);
      qaWidgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        window.location.assign(setNextQAIndexToUrl(index + 1, new URL(payload[index + 1].link)));
      });
    } else {
      const completeBtn = utils.createTag('button', { class: 'button', type: 'submit' }, 'Done');
      const noteArea = utils.createTag('textarea', {
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

    checkboxAll.addEventListener('change', () => {
      checkboxes.forEach((cb) => {
        cb.checked = checkboxAll.checked;
      });
    });
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

function continueQAGuide(callback) {
  const usp = new URLSearchParams(window.location.search);
  const qaIndex = parseInt(usp.get('qaprogress'), 10);

  if (qaIndex) {
    callback();
  }
}

export default function init({
  createTag,
}) {
  const utils = { createTag };
  const sk = document.querySelector('helix-sidekick');

  const launchQAGuide = async () => {
    const resp = await fetch('/docs/qa-guide.plain.html');
    if (!resp.ok) return;

    const main = createTag('main');
    main.innerHTML = await resp.text();
    const qaGuideEl = main.querySelector('.qa-guide');

    initQAGuide(qaGuideEl, utils);
  };

  // Auto plugins
  continueQAGuide(launchQAGuide);

  // Add plugin listeners here
  sk.addEventListener('custom:qa-guide', launchQAGuide);
}
