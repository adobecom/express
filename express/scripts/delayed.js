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

export const loadExpressProduct = async (createTag, getDevice) => {
  if (!window.hlx.preload_product) return;
  if (getDevice() !== 'desktop') return;
  const path = ['www.adobe.com'].includes(window.location.hostname)
    ? 'https://new.express.adobe.com/static/preload.html' : 'https://stage.projectx.corp.adobe.com/static/preload.html';
  const iframe = createTag('iframe', { src: path, style: 'display:none' });
  document.body.append(iframe);
};

/**
 * Executes everything that happens a lot later, without impacting the user experience.
 */
export default function loadDelayed([
  createTag,
  getDevice,
], DELAY = 3000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      loadExpressProduct(createTag, getDevice);
      resolve();
    }, DELAY);
  });
}
