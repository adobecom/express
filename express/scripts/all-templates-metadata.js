import { getHelixEnv, getLocale } from './utils.js';
import { memoize } from './hofs.js';

const memoizedFetchUrl = memoize((url) => fetch(url).then((r) => (r.ok ? r.json() : null)), {
  key: (q) => q,
  ttl: 1000 * 60 * 60 * 24,
});

let allTemplatesMetadata;

export default async function fetchAllTemplatesMetadata() {
  const locale = getLocale(window.location);
  const urlPrefix = locale === 'us' ? '' : `/${locale}`;

  if (!allTemplatesMetadata) {
    try {
      const env = getHelixEnv();
      const dev = new URLSearchParams(window.location.search).get('dev');
      let sheet;

      if (['yes', 'true', 'on'].includes(dev) && env?.name === 'stage') {
        sheet = '/templates-dev.json?sheet=seo-templates&limit=100000';
      } else {
        sheet = `${urlPrefix}/express/templates/default/metadata.json?limit=100000`;
      }

      const resp = await memoizedFetchUrl(sheet);
      allTemplatesMetadata = resp?.data;
    } catch (err) {
      allTemplatesMetadata = [];
    }
  }
  return allTemplatesMetadata;
}
