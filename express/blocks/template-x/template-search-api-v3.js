/* eslint-disable no-underscore-dangle */
import { fetchPlaceholders, getConfig } from '../../scripts/utils.js';
import { memoize } from '../../scripts/hofs.js';

// supported by content api
const supportedLanguages = [
  'ar-SA',
  'cs-CZ',
  'da-DK',
  'de-DE',
  'es-ES',
  'el-GR',
  'en-US',
  'fi-FI',
  'fil-PH',
  'fr-FR',
  'hi-IN',
  'id-ID',
  'it-IT',
  'i-DEFAULT',
  'ja-JP',
  'ko-KR',
  'MS-MY',
  'nb-NO',
  'nl-NL',
  'pl-PL',
  'pt-BR',
  'ro-RO',
  'ru-RU',
  'sv-SE',
  'th-TH',
  'tr-TR',
  'uk-UA',
  'vi-VN',
  'zh-Hant-TW',
  'zh-Hans-CN',
];

function extractFilterTerms(input) {
  if (!input || typeof input !== 'string') {
    return [];
  }
  return input
    .split('AND')
    .map((t) => t
      .trim()
      .toLowerCase());
}
function extractLangs(locales) {
  return locales.toLowerCase().split(' or ').map((l) => l.trim());
}
function extractRegions(locales) {
  return extractLangs(locales).map((l) => (l === 'en' ? 'ZZ' : l.toUpperCase()));
}
function formatFilterString(filters) {
  const {
    animated,
    locales,
    behaviors,
    premium,
    tasks,
    topics,
  } = filters;
  let str = '';
  if (premium && premium !== 'all') {
    str += `&filters=licensingCategory==${premium.toLowerCase() === 'false' ? 'free' : 'premium'}`;
  }
  if (animated && animated !== 'all' && !behaviors) {
    str += `&filters=behaviors==${animated.toLowerCase() === 'false' ? 'still' : 'animated'}`;
  }
  if (behaviors) {
    extractFilterTerms(behaviors).forEach((behavior) => {
      str += `&filters=behaviors==${behavior.split(',').map((b) => b.trim()).join(',')}`;
    });
  }
  extractFilterTerms(tasks).forEach((task) => {
    str += `&filters=pages.task.name==${task.split(',').map((t) => t.trim()).join(',')}`;
  });
  extractFilterTerms(topics).forEach((topic) => {
    str += `&filters=topics==${topic.split(',').map((t) => t.trim()).join(',')}`;
  });
  // locale needs backward compatibility with old api
  const confLocales = getConfig().locales;
  if (locales) {
    const langFilter = extractLangs(locales)
      .map((l) => confLocales[l === 'en' ? '' : l]?.ietf)
      .filter((l) => supportedLanguages.includes(l))
      .join(',');
    if (langFilter) str += `&filters=language==${langFilter}`;

    // No Region Filter as template region tagging is still inconsistent.
    // We still have Region Boosting via x-express-ims-region-code header
    // const regionFilter = extractRegions(locales).join(',');
    // if (regionFilter) str += `&filters=applicableRegions==${regionFilter}`;
  }

  return str;
}

const memoizedFetch = memoize(
  (url, headers) => fetch(url, headers).then((r) => (r.ok ? r.json() : null)), { ttl: 30 * 1000 },
);

async function fetchSearchUrl({
  limit, start, filters, sort, q, collectionId,
}) {
  const base = 'https://www.adobe.com/express-search-api-v3';
  const collectionIdParam = `collectionId=${collectionId}`;
  const queryType = 'search';
  const queryParam = `&queryType=${queryType}`;
  const filterStr = formatFilterString(filters);
  const limitParam = limit || limit === 0 ? `&limit=${limit}` : '';
  const startParam = start ? `&start=${start}` : '';
  const sortParam = {
    'Most Relevant': '',
    'Most Viewed': '&orderBy=-remixCount',
    'Rare & Original': '&orderBy=remixCount',
    'Newest to Oldest': '&orderBy=-availabilityDate',
    'Oldest to Newest': '&orderBy=availabilityDate',
  }[sort] || sort || '';
  const qParam = q && q !== '{{q}}' ? `&q=${q}` : '';
  const url = encodeURI(
    `${base}?${collectionIdParam}${queryParam}${qParam}${limitParam}${startParam}${sortParam}${filterStr}`,
  );

  const langs = extractLangs(filters.locales);
  if (langs.length === 0) {
    return memoizedFetch(url);
  }

  const headers = {};
  const prefLang = getConfig().locales?.[langs[0] === 'en' ? '' : langs[0]]?.ietf;
  const [prefRegion] = extractRegions(filters.locales);
  headers['x-express-ims-region-code'] = prefRegion; // Region Boosting
  if (prefLang && supportedLanguages.includes(prefLang)) {
    headers['x-express-pref-lang'] = prefLang; // Language Boosting
  }

  const res = await memoizedFetch(url, { headers });
  if (!res) return res;
  if (langs.length > 1 && supportedLanguages.includes(prefLang)) {
    // a template can have many regions but only 1 language, so we group by language
    res.items = [
      ...res.items.filter(({ language }) => language === prefLang),
      ...res.items.filter(({ language }) => language !== prefLang)];
  }
  return res;
}

async function getFallbackMsg(tasks = '') {
  const placeholders = await fetchPlaceholders();
  const fallbackTextTemplate = tasks && tasks !== "''" ? placeholders['templates-fallback-with-tasks'] : placeholders['templates-fallback-without-tasks'];

  if (fallbackTextTemplate) {
    return tasks ? fallbackTextTemplate.replaceAll('{{tasks}}', tasks.toString()) : fallbackTextTemplate;
  }

  return `Sorry we couldn't find any results for what you searched for, try some of these popular ${
    tasks ? ` ${tasks.toString()} ` : ''}templates instead.`;
}

async function fetchTemplatesNoToolbar(props) {
  const { filters, limit } = props;
  const langs = extractLangs(filters.locales);
  if (langs.length <= 1) {
    return { response: await fetchSearchUrl(props) };
  }
  const [prefLangPromise, backupLangPromise] = [
    fetchSearchUrl({
      ...props,
      filters: {
        ...filters,
        locales: langs[0],
      },
    }),
    fetchSearchUrl({
      ...props,
      filters: {
        ...filters,
        locales: langs.slice(1).join(' or '),
      },
    })];
  const prefLangRes = await prefLangPromise;
  if (!prefLangRes) return { response: prefLangRes };
  if (prefLangRes.items?.length >= limit) return { response: prefLangRes };

  const backupLangRes = await backupLangPromise;
  const dedup = (items) => {
    const [set, arr] = [new Set(), []];
    items.forEach((item) => {
      if (!set.has(item.id)) {
        set.add(item.id);
        arr.push(item);
      }
    });
    return arr;
  };
  const mergedItems = dedup([...prefLangRes.items, ...backupLangRes.items])
    .slice(0, limit);
  return {
    response: {
      metadata: {
        totalHits: mergedItems.length,
        start: '0',
        limit,
      },
      items: mergedItems,
    },
  };
}

async function fetchTemplatesWithToolbar(props) {
  let response = await fetchSearchUrl(props);

  if (response?.metadata?.totalHits > 0) {
    return { response };
  }
  const { filters: { tasks, locales } } = props;
  if (tasks) {
    response = await fetchSearchUrl({ ...props, filters: { tasks, locales, premium: 'false' }, q: '' });
    if (response?.metadata?.totalHits > 0) {
      return { response, fallbackMsg: await getFallbackMsg(tasks) };
    }
  }
  response = await fetchSearchUrl({ ...props, filters: { locales, premium: 'false' }, q: '' });
  if (response?.metadata?.totalHits > 0) {
    return { response, fallbackMsg: await getFallbackMsg() };
  }
  // ultimate fallback in case no fallback locale is authored
  response = await fetchSearchUrl({ ...props, filters: {}, q: '' });
  return { response, fallbackMsg: await getFallbackMsg() };
}

function isValidBehaviors(behaviors) {
  const collectivelyExhausiveBehaviors = ['animated', 'video', 'still'];
  return behaviors.some((b) => collectivelyExhausiveBehaviors.includes(b))
    && (!behaviors.includes('still') || !(behaviors.includes('video') || behaviors.includes('animated')));
}

export function isValidTemplate(template) {
  return !!(template.status === 'approved'
    && template.customLinks?.branchUrl
    && template.pages?.[0]?.rendition?.image?.thumbnail?.componentId
    && template._links?.['http://ns.adobe.com/adobecloud/rel/rendition']?.href?.replace
    && template._links?.['http://ns.adobe.com/adobecloud/rel/component']?.href?.replace
    && isValidBehaviors(template.behaviors));
}

export async function fetchTemplatesCategoryCount(props, tasks) {
  const res = await fetchSearchUrl({
    ...props,
    limit: 0,
    filters: {
      ...props.filters,
      tasks,
    },
  });
  return res?.metadata?.totalHits || 0;
}

export async function fetchTemplates(props) {
  // api rejects 10000+
  const start = parseInt(props.start, 10);
  if (Number.isInteger(start) && start > 9999) {
    return { response: null, fallbackMsg: await getFallbackMsg() };
  }
  // different strategies w/o toolBar
  if (props.toolBar) return fetchTemplatesWithToolbar(props);
  return fetchTemplatesNoToolbar(props);
}
