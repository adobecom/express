/* eslint-disable import/prefer-default-export */
import {
  getConfig,
  getHelixEnv,
} from './utils.js';
import { memoize } from './hofs.js';

const endpoints = {
  stage: {
    // cdn: 'https://www.stage.adobe.com/ax-uss-api/',
    cdn: 'https://hz-template-search-stage.adobe.io/uss/v3/query',
    url: 'https://hz-template-search-stage.adobe.io/uss/v3/query',
    key: 'spaas-service-eng',
  },
  prod: {
    cdn: 'https://www.adobe.com/ax-uss-api/',
    url: 'https://hz-template-search.adobe.io/uss/v3/query',
    key: window.atob('dGVtcGxhdGUtbGlzdC1saW5rbGlzdC1mYWNldA=='),
  },
};

const mFetch = memoize((url, data) => fetch(url, data).then((r) => (r.ok ? r.json() : null)), {
  ttl: 1000 * 60 * 60 * 24,
});

export async function getDataWithContext() {
  const { locale } = getConfig();
  const textQuery = window.location.pathname.split('/')
    .filter(Boolean)
    .map((s) => s.trim())
    .filter((s) => !['express', 'templates', 'colors', locale.prefix.replace('/', '')].includes(s))
    .reverse()
    .join(' ');
  const data = {
    experienceId: 'default-templates-search-seo',
    querySuggestion: {
      facet: {
        'function:querySuggestions': {},
      },
    },
    textQuery,
    locale: locale.ietf || 'en-US',
    queries: [{
      id: 'template_1',
      scope: { entities: ['HzTemplate'] },
    }],
  };

  let result = null;
  const endpoint = endpoints[getHelixEnv().name];
  let targetURl = endpoint.url;

  if (['www.adobe.com', 'www.stage.adobe.com'].includes(window.location.hostname)) {
    targetURl = endpoint.cdn;
  }
  try {
    result = await mFetch(targetURl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.adobe.search-request+json',
        'x-api-key': endpoint.key,
        'x-gw-ims-client-id': 'express',
      },
      body: JSON.stringify(data),
    });
  } catch (err) {
    window.lana?.log('error fetching sdc browse api:', err.message);
  }
  return result?.status?.httpCode !== 200 ? null : result;
}
