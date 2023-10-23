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

import {
  createTag,
} from '../../scripts/utils.js';

function setQAIndex(index, url) {
  const usp = new URLSearchParams(url.search);
  usp.set('qaprogress', index + 1);
  url.search = usp.toString();
  return decodeURIComponent(url.toString());
}

function getQAIndex() {
  const usp = new URLSearchParams(window.location.search);
  return Math.parseInt(usp.get('qaprogress')) - 1;
}

export default async function init(el) {
  const pages = Array.from(el.children);

  if (!pages.length) return;

  const index = getQAIndex();

  console.log(index);
  if (!index) {
    const testPage = pages[0].querySelector(':scope > div:first-of-type > a, :scope > div:first-of-type');
    if (!testPage) {
      el.textContent = 'Missing QA url(s)';
      return;
    }

    const url = new URL(testPage.href || testPage.textContent);
    const targetUrl = setQAIndex(0, url);
    window.open(targetUrl);
  }
}
