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

import { getConfig } from '../../scripts/utils.js';

/* c8 ignore next 11 */
function handleEvent(prefix, link) {
  document.cookie = `international=${prefix};path=/`;
  sessionStorage.setItem('international', prefix);
  const fetchUrl = (url) => fetch(url, { method: 'HEAD' })
    .then((response) => {
      if (!response.ok) throw new Error('request failed');
      window.location.assign(url);
    });

  fetchUrl(link.href, { method: 'HEAD' }).catch(() => {
    if (prefix === 'uk' || prefix === 'in') {
      fetchUrl(link.href.replace(`/${prefix}/`, '/')).catch(() => {
        window.location.assign('/');
      });
    } else {
      const prefixUrl = prefix ? `/${prefix}` : '';
      window.location.assign(`${prefixUrl}/`);
    }
  });
}

function decorateLink(link, path) {
  let pathname = link.getAttribute('href');
  if (pathname.startsWith('http')) {
    try {
      pathname = new URL(pathname).pathname;
    } catch (e) { /* href does not contain domain */ }
  }
  const linkParts = pathname.split('/');
  const prefix = linkParts[1] || 'us';
  let { href } = link;
  if (href.endsWith('/')) href = href.slice(0, -1);
  link.href = `${href}${path}`;
  link.addEventListener('click', (e) => {
    /* c8 ignore next 2 */
    e.preventDefault();
    handleEvent(prefix, link);
  });
}

export default function init(block) {
  const { prefix } = getConfig().locale;
  const divs = block.querySelectorAll(':scope > div');
  if (divs.length < 2) return;
  const links = divs[1].querySelectorAll('a');
  if (!links.length) return;
  const path = window.location.href.replace(`${window.location.origin}${prefix}`, '');
  links.forEach((l) => decorateLink(l, path));
}
