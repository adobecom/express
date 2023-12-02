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

const QA_GUIDE_FILE_LOCATION = '/docs/qa-guide.plain.html';

export function autoWidgetByUSP(name, callback) {
  const usp = new URLSearchParams(window.location.search);
  const qaIndex = parseInt(usp.get(name), 10);

  if (qaIndex) {
    callback();
  }
}

export default function init({
  createTag,
}) {
  const sk = document.querySelector('helix-sidekick');

  const launchQAGuide = async () => {
    const resp = await fetch(QA_GUIDE_FILE_LOCATION);
    if (!resp.ok) return;

    const main = createTag('main');
    main.innerHTML = await resp.text();
    const audience = document.body.dataset?.device;
    let qaGuideEl = main.querySelector('.qa-guide.desktop');
    if (audience) qaGuideEl = main.querySelector(`.qa-guide.${audience}`);

    const { default: initQAGuide } = await import('../features/qa-guide/qa-guide.js');

    initQAGuide(qaGuideEl);
  };

  // Auto plugins
  autoWidgetByUSP('qaprogress', launchQAGuide);

  // Add plugin listeners here
  sk.addEventListener('custom:qa-guide', launchQAGuide);
}
