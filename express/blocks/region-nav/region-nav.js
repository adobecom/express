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

const redirectMap = new Map(
  [
    ['ae_ar', '/'],
    ['ae_en', '/'],
    ['africa', '/'],
    ['ar', '/es/'],
    ['at', '/de/'],
    ['au', '/'],
    ['be_en', '/'],
    ['be_fr', '/fr/'],
    ['be_nl', '/nl/'],
    ['bg', '/'],
    ['ca', '/'],
    ['ca_fr', '/fr/'],
    ['cis_en', '/'],
    ['cis_ru', '/'],
    ['cr', '/es/'],
    ['cy_en', '/'],
    ['cz', '/'],
    ['ch_de', '/de/'],
    ['ch_fr', '/fr/'],
    ['ch_it', '/it/'],
    ['cl', '/es/'],
    ['co', '/es/'],
    ['cr', '/es/'],
    ['da-DK', '/dk/'],
    ['de-DE', '/de/'],
    ['ec', '/es/'],
    ['ee', '/'],
    ['eg_ar', '/'],
    ['eg_en', '/'],
    ['es-ES', '/es/'],
    ['fi-FI', '/fi/'],
    ['fr-FR', '/fr/'],
    ['gr_en', '/'],
    ['gr_el', '/'],
    ['gt', '/es/'],
    ['hk_en', '/'],
    ['hk_zh', '/tw/'],
    ['hu', '/'],
    ['id_en', '/'],
    ['id_id', '/'],
    ['ie', '/'],
    ['il_en', '/'],
    ['il_he', '/'],
    ['in', '/'],
    ['in_hi', '/'],
    ['it-IT', '/it/'],
    ['ja-JP', '/jp/'],
    ['ko-KR', '/kr/'],
    ['kw_ar', '/'],
    ['kw_en', '/'],
    ['la', '/es/'],
    ['lt', '/'],
    ['lu_en', '/'],
    ['lu_de', '/de/'],
    ['lu_fr', '/fr/'],
    ['lv', '/'],
    ['mena_ar', '/'],
    ['mena_en', '/'],
    ['mt', '/'],
    ['mx', '/es/'],
    ['my_en', '/'],
    ['my_ms', '/'],
    ['nb-NO', '/no/'],
    ['ng', '/'],
    ['nl-NL', '/nl/'],
    ['nz', '/'],
    ['pe', '/es/'],
    ['ph_en', '/'],
    ['ph_fil', '/'],
    ['pl', '/'],
    ['pr', '/es/'],
    ['pt', '/br/'],
    ['pt-BR', '/br/'],
    ['qa_ar', '/'],
    ['qa_en', '/'],
    ['ro', '/'],
    ['ru', '/'],
    ['sa_ar', '/'],
    ['sa_en', '/'],
    ['sea', '/'],
    ['sg', '/'],
    ['si', '/'],
    ['sk', '/'],
    ['sv-SE', '/se/'],
    ['th_en', '/'],
    ['th_th', '/'],
    ['tr', '/'],
    ['ua', '/'],
    ['uk', '/'],
    ['dk', '/'],
    ['it', '/'],
    ['br', '/'],
    ['cn', '/'],
    ['de', '/'],
    ['es', '/'],
    ['fi', '/'],
    ['fr', '/'],
    ['jp', '/'],
    ['kr', '/'],
    ['nl', '/'],
    ['no', '/'],
    ['se', '/'],
    ['tw', '/'],
    ['vn_en', '/'],
    ['vn_vi', '/'],
    ['za', '/'],
    ['zh-Hans-CN', '/cn/'],
    ['zh-Hant-TW', '/tw/'],
  ],
);

/* c8 ignore next 11 */
function handleEvent(prefix, link) {
  const prefixNoSlash = prefix.replace('/', '');
  document.cookie = `international=${prefixNoSlash};path=/`;
  sessionStorage.setItem('international', prefixNoSlash);
  const fetchUrl = (url) => fetch(url, { method: 'HEAD' })
    .then((response) => {
      if (!response.ok) throw new Error('request failed');
      window.location.assign(url);
    });

  fetchUrl(link.href, { method: 'HEAD' }).catch(() => {
    if (prefix === 'uk' || prefix === 'in') {
      fetchUrl(link.href.replace(`${prefix}/`, '/')).catch(() => {
        window.location.assign('/express/?notification=pageDidNotExist');
      });
    } else {
      window.location.assign(`${prefix}/express/?notification=pageDidNotExist`);
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
  const { locales } = getConfig();
  const locale = locales[prefix === 'us' ? '' : prefix];
  let redirect = false;
  if (!locale) {
    const valueInMap = redirectMap.get(prefix)?.replaceAll('/', '') ?? '';
    href = href.replace(prefix, valueInMap);
    if (href.endsWith('/')) href = href.slice(0, -1);
    redirect = true;
  }
  link.href = `${href}${path}`;
  if (redirect) {
    const url = new URL(link.href);
    url.searchParams.append('notification', 'pageDidNotExist');
    link.href = url.href;
  }
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
