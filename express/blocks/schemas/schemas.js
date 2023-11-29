import {
  getConfig,
} from '../../scripts/utils.js';

function decorateSchemasBlocks(block) {
  const rows = Array.from(block.children);
  const { prefix } = getConfig().locale;
  const homePageLocaleUrl = `https://www.adobe.com${prefix}/`;
  let webApplicationUrl = document.querySelector('p.button-container')?.querySelector('a')?.href;
  rows.forEach(($row) => {
    const cells = Array.from($row.children);
    const cellValue = cells[0].innerText;
    if (cellValue !== '') {
      webApplicationUrl = cellValue;
    }
  });
  const webPageSchemaScript = document.createElement('script');
  webPageSchemaScript.setAttribute('type', 'application/ld+json');
  const webSchemaJson = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: window.location.href,
    '@id': `${window.location.href}/#webpage`,
    isPartOf: {
      '@type': 'Website',
      url: homePageLocaleUrl,
      '@id': `${homePageLocaleUrl}#website`,
      publisher: {
        '@type': 'Corporation',
        name: 'Adobe',
        legalName: 'Adobe Inc.',
        '@id': 'https://www.adobe.com#organization',
        tickerSymbol: 'ADBE',
        sameAs: [
          'https://www.linkedin.com/company/adobe/',
          'https://www.instagram.com/adobe/',
          'https://twitter.com/Adobe',
          'https://en.wikipedia.org/wiki/Adobe_Inc.'],
      },
    },
    about: {
      '@type': 'WebApplication',
      name: 'Adobe Express',
      url: webApplicationUrl,
      '@id': `${webApplicationUrl}#webapplication`,
      browserRequirements: ['requires HTML5 support', 'requires JavaScript'],
      sameAs: `${homePageLocaleUrl}express/`,
      applicationCategory: 'DesignApplication',
      applicationSuite: 'Adobe Creative Cloud',
      permissions: 'may run only with an active internet connection',
      operatingSystem: ['Windows 8.1 or later', 'macOS 10.13 or later', 'Chromebook'],
      memoryRequirements: '4-GB',
      copyrightHolder: { '@id': 'https://www.adobe.com#organization' },
      creator: { '@id': 'https://www.adobe.com#organization' },
      publisher: { '@id': 'https://www.adobe.com#organization' },
      maintainer: { '@id': 'https://www.adobe.com#organization' },
    },
  };
  webPageSchemaScript.textContent = JSON.stringify(webSchemaJson);
  document.head.appendChild(webPageSchemaScript);
}

export default function decorate(block) {
  decorateSchemasBlocks(block);
}
