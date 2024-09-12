import { fetchPlaceholders, getConfig } from '../../scripts/utils.js';

const domain = window.location.host === 'adobe.com'
  || window.location.host.endsWith('.adobe.com') ? 'domain=adobe.com' : '';

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
function handleEvent(prefix, link, valueInMap) {
  document.cookie = `international=${prefix};path=/;${domain}`;
  sessionStorage.setItem('international', prefix);
  const fetchUrl = (url) => fetch(url, { method: 'HEAD' })
    .then((response) => {
      if (!response.ok) throw new Error('request failed');
      window.location.assign(url);
    });

  fetchUrl(link.href, { method: 'HEAD' }).catch(() => {
    if (prefix === 'uk' || prefix === 'in') {
      fetchUrl(link.href.replace(`${prefix}/`, '/')).catch(() => {
        window.location.assign('/express/');
      });
    } else {
      window.location.assign(`/${valueInMap ?? prefix}/express/`);
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
  let valueInMap;
  if (!locale) {
    valueInMap = redirectMap.get(prefix)?.replaceAll('/', '') ?? '';
    const index = href.lastIndexOf(prefix);
    if (index > 0) {
      href = href.substring(0, index) + valueInMap + href.substring(index + prefix.length);
    }
    if (href.endsWith('/')) href = href.slice(0, -1);
  }
  link.href = `${href}${path}`;
  link.addEventListener('click', (e) => {
    /* c8 ignore next 2 */
    e.preventDefault();
    handleEvent(prefix, link, valueInMap);
  });
}

export default function init(block) {
  fetchPlaceholders().then((placeholders) => {
    const pTags = block.querySelectorAll('p');
    pTags[0].textContent = pTags[0].textContent.replaceAll('{{change-region}}', placeholders['change-region'] ?? 'Choose your region');
    pTags[1].textContent = pTags[1].textContent.replaceAll('{{change-region-description}}', placeholders['change-region-description'] ?? 'Selecting a region changes the language and/or content on Adobe.com');
  });

  const { prefix } = getConfig().locale;
  const divs = block.querySelectorAll(':scope > div');
  if (divs.length < 2) return;
  const links = divs[1].querySelectorAll('a');
  if (!links.length) return;
  const path = window.location.href.replace(`${window.location.origin}${prefix}`, '');
  links.forEach((l) => decorateLink(l, path));
}
