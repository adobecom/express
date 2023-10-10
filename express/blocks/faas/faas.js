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

import { createIntersectionObserver } from '../../scripts/utils.js';
import { initFaas, loadFaasFiles } from './utils.js';

const ROOT_MARGIN = 1000;

const b64ToUtf8 = (str) => decodeURIComponent(escape(window.atob(str)));

function parseEncodedConfig(encodedConfig) {
  try {
    return JSON.parse(b64ToUtf8(decodeURIComponent(encodedConfig)));
  } catch (e) {
    console.log(e);
  }
  return null;
}

const loadFaas = async (a) => {
  await loadFaasFiles();
  const encodedConfig = a.href.split('#')[1];
  const faas = initFaas(parseEncodedConfig(encodedConfig), a);

  // if FaaS is in Modal, make it column2 style.
  if (faas && faas.closest('.dialog-modal')) {
    faas.querySelector('.faas').classList.add('column2');
  }
};

export default async function init(a) {
  if (a.textContent.includes('no-lazy')) {
    loadFaas(a);
  } else {
    createIntersectionObserver({
      el: a,
      options: { rootMargin: `${ROOT_MARGIN}px` },
      callback: loadFaas,
    });
  }
}
