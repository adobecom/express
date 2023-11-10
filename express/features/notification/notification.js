/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { fetchPlaceholders, createTag } from '../../scripts/utils.js';

function showToast(text) {
  const toast = createTag('div', { class: 'toast show' }, text);
  document.body.append(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

export default async function loadNotifications(notification) {
  if (notification === 'pageDidNotExist') {
    fetchPlaceholders().then((placeholders) => {
      const text = placeholders['page-did-not-exist'] ?? 'page does not exist';
      showToast(text);
    });
  }
}
