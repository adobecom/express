import { getConfig } from '../utils.js';

let federatedContentRoot;
/* eslint-disable import/prefer-default-export */
export const getFederatedContentRoot = () => {
  const cdnAllowedOrigins = [
    'https://www.adobe.com',
    'https://business.adobe.com',
    'https://blog.adobe.com',
    'https://milo.adobe.com',
    'https://news.adobe.com',
  ];
  const { allowedOrigins = [] } = getConfig();
  if (federatedContentRoot) return federatedContentRoot;

  const { origin } = window.location;
  federatedContentRoot = [...allowedOrigins, ...cdnAllowedOrigins].some((o) => origin.replace('.stage', '') === o)
    ? origin
    : 'https://www.adobe.com';

  if (origin.includes('localhost') || origin.includes('.hlx.')) {
    // Akamai as proxy to avoid 401s, given AEM-EDS MS auth cross project limitations
    federatedContentRoot = origin.includes('.hlx.live')
      ? 'https://main--federal--adobecom.hlx.live'
      : 'https://www.stage.adobe.com';
  }

  return federatedContentRoot;
};

// TODO we should match the akamai patterns /locale/federal/ at the start of the url
// and make the check more strict.
export const getFederatedUrl = (url = '') => {
  if (typeof url !== 'string' || !url.includes('/federal/')) return url;
  if (url.startsWith('/')) return `${getFederatedContentRoot()}${url}`;
  try {
    const { pathname, search, hash } = new URL(url);
    return `${getFederatedContentRoot()}${pathname}${search}${hash}`;
  } catch (e) {
    window.lana?.log(`getFederatedUrl errored parsing the URL: ${url}: ${e.toString()}`);
  }
  return url;
};
