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
  const buildPayload = (pages) => pages.map((p) => ({
    link: p.querySelector(':scope > div:first-of-type > a, :scope > div:first-of-type').textContent || null,
    items: Array.from(p.querySelectorAll('li')).map((li) => li.textContent),
  }));

  const getQAIndex = () => {
    const usp = new URLSearchParams(window.location.search);
    return parseInt(usp.get('qaprogress'), 10) - 1;
  };

  const setQAIndex = (index, url) => {
    const usp = new URLSearchParams(url.search);
    usp.set('qaprogress', index + 1);
    url.search = usp.toString();
    return decodeURIComponent(url.toString());
  };

  const logQARecord = () => {
    fetch('/express/qa-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          timestamp: Date.now().toLocaleString('en-GB', { timeZone: 'UTC' }),
        },
      }),
    });
  };

  const buildQAWidget = (index, payload) => {
    const qaWidget = utils.createTag('div', { class: 'qa-widget' });
    const qaWidgetForm = utils.createTag('form', { class: 'qa-widget-form' });

    payload[index].items.forEach((item, i) => {
      const checkBox = utils.createTag('input', { type: 'checkbox', name: `checkbox-${i + 1}`, required: true });
      const checkLabel = utils.createTag('label', { for: `checkbox-${i + 1}` }, item);
      const checkBoxWrapper = utils.createTag('div');
      checkBoxWrapper.append(checkLabel, checkBox);
      qaWidgetForm.append(checkBoxWrapper);
    });

    if (payload[index + 1]) {
      const nextBtn = utils.createTag('button', { class: 'button', type: 'submit' }, 'Next');
      qaWidgetForm.append(nextBtn);
      qaWidgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        window.location.assign(payload[index + 1].link);
      });
    } else {
      const completeBtn = utils.createTag('button', { class: 'button', type: 'submit' }, 'Done');
      qaWidgetForm.append(completeBtn);
      qaWidgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        logQARecord();
        qaWidget.remove();
      });
    }

    qaWidget.append(qaWidgetForm);
    document.body.append(qaWidget);
  };

  const pages = Array.from(el.children);

  if (!pages.length) return;

  const payload = buildPayload(pages);

  const index = getQAIndex();

  if (index === null) {
    const testPage = payload[0].link;
    if (!testPage) {
      el.textContent = 'Missing QA url(s)';
      return;
    }

    const url = new URL(testPage.href || testPage.textContent);
    const targetUrl = setQAIndex(0, url);
    window.open(targetUrl);
  } else if (!document.querySelector('.qa-widget')) {
    buildQAWidget(index, payload);
  }
}

export default function init({
  createTag,
}) {
  const utils = { createTag };
  const sk = document.querySelector('helix-sidekick');

  const qaGuideListener = async () => {
    const resp = await fetch('/docs/qa-guide.plain.html');
    if (!resp.ok) return;

    const main = createTag('main');
    main.innerHTML = await resp.text();
    const qaGuideEl = main.querySelector('.qa-guide');

    initQAGuide(qaGuideEl, utils);
  };

  // Add plugin listeners here
  sk.addEventListener('custom:qa-guide', qaGuideListener);
}
