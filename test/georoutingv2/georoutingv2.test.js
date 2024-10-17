import { stub } from 'sinon';
import { expect } from '@esm-bundle/chai';

const { default: init, getCookie } = await import('../../express/features/georoutingv2/georoutingv2.js');
let { getMetadata } = await import('../../express/scripts/utils.js');
const { getFederatedContentRoot } = await import('../../express/scripts/utils/federated.js');
const {
  createTag, loadStyle, loadBlock, setConfig,
} = await import('../../express/scripts/utils.js');

const locales = {
  '': { ietf: 'en-US', tk: 'jdq5hay.css' },
  br: { ietf: 'pt-BR', tk: 'inq1xob.css' },
  cn: { ietf: 'zh-Hans-CN', tk: 'puu3xkp' },
  de: { ietf: 'de-DE', tk: 'vin7zsi.css' },
  dk: { ietf: 'da-DK', tk: 'aaz7dvd.css' },
  es: { ietf: 'es-ES', tk: 'oln4yqj.css' },
  fi: { ietf: 'fi-FI', tk: 'aaz7dvd.css' },
  fr: { ietf: 'fr-FR', tk: 'vrk5vyv.css' },
  gb: { ietf: 'en-GB', tk: 'pps7abe.css' },
  id_id: { ietf: 'id-ID', tk: 'cya6bri.css' },
  in: { ietf: 'en-IN', tk: 'pps7abe.css' },
  it: { ietf: 'it-IT', tk: 'bbf5pok.css' },
  jp: { ietf: 'ja-JP', tk: 'dvg6awq' },
  kr: { ietf: 'ko-KR', tk: 'qjs5sfm' },
  nl: { ietf: 'nl-NL', tk: 'cya6bri.css' },
  no: { ietf: 'no-NO', tk: 'aaz7dvd.css' },
  se: { ietf: 'sv-SE', tk: 'fpk1pcd.css' },
  tr: { ietf: 'tr-TR', tk: 'ley8vds.css' },
  tw: { ietf: 'zh-Hant-TW', tk: 'jay0ecd' },
  uk: { ietf: 'en-GB', tk: 'pps7abe.css' },
};

const mockConfig = {
  locales,
  locale: { contentRoot: window.location.href, prefix: '' },
  env: 'test',
  codeRoot: '/express',
};
setConfig(mockConfig);

const mockGeoroutingJson = {
  georouting: {
    data: [
      {
        prefix: '',
        title: "You're visiting Adobe.com for {{geo}}.",
        text: "Based on your location, we think you may prefer the United States website, where you'll get geoal content, offerings, and pricing",
        button: 'United States',
        akamaiCodes: 'US',
        language: '',
        languageOrder: '',
        geo: 'us',
      },
      {
        prefix: 'de',
        title: 'Sie besuchen Adobe.com für {{geo}}.',
        text: 'Aufgrund Ihres Standorts denken wir, dass Sie die deutsche Website bevorzugen könnten, auf der Sie geoale Inhalte, Angebote und Preise finden werden',
        button: 'Deutschland',
        akamaiCodes: 'DE',
        language: '',
        languageOrder: '',
        geo: 'de',
      },
    ],
  },
  geos: {
    data: [
      {
        prefix: 'de',
        us: 'die Vereinigten Staaten',
        de: 'Deutschland',
        ch: 'die Schweiz',
        mena: 'den Nahen Osten und Nordafrika',
        africa: 'Afrika',
      },
    ],
  },
};

let stubURLSearchParamsGet = stub(URLSearchParams.prototype, 'get');
const setUserCountryFromIP = (country = 'DE') => {
  stubURLSearchParamsGet = stubURLSearchParamsGet.withArgs('akamaiLocale').returns(country);
};
const setGeorouting = (setting) => {
  stubURLSearchParamsGet = stubURLSearchParamsGet.withArgs('georouting').returns(setting);
};

const ogFetch = window.fetch;
window.fetch = stub();

function stubHeadRequestToReturnVal(prefix, val) {
  const path = window.location.href.replace(`${window.location.origin}`, '');
  window.fetch.withArgs(`${prefix}${path}`, { method: 'HEAD' }).returns(
    new Promise((resolve) => {
      resolve({ ok: val });
    }),
  );
}

const stubFetchForGeorouting = (val) => {
  window.fetch.withArgs('/georoutingv2.json').returns(
    new Promise((resolve) => {
      resolve({
        ok: val,
        json: () => mockGeoroutingJson,
      });
    }),
  );
  mockGeoroutingJson.georouting.data.forEach((d) => {
    const prefix = d.prefix ? `/${d.prefix}` : '';
    stubHeadRequestToReturnVal(prefix, true);
  });
};

const stubFetchForGeoroutingOld = (val) => {
  window.fetch.withArgs('/georouting.json').returns(
    new Promise((resolve) => {
      resolve({
        ok: val,
        json: () => mockGeoroutingJson,
      });
    }),
  );
  mockGeoroutingJson.georouting.data.forEach((d) => {
    const prefix = d.prefix ? `/${d.prefix}` : '';
    stubHeadRequestToReturnVal(prefix, true);
  });
};

const stubFetchForFederalGeorouting = () => {
  window.fetch.withArgs(`${getFederatedContentRoot()}/federal/georouting/georoutingv2.json`).returns(
    new Promise((resolve) => {
      resolve({
        ok: true,
        json: () => mockGeoroutingJson,
      });
    }),
  );
  mockGeoroutingJson.georouting.data.forEach((d) => {
    const prefix = d.prefix ? `/${d.prefix}` : '';
    stubHeadRequestToReturnVal(prefix, true);
  });
};
const stubFallbackMetadata = (fallbackrouting) => {
  getMetadata = stub();
  getMetadata.withArgs('fallbackrouting').returns(fallbackrouting);
};
const restoreFetch = () => {
  window.fetch = ogFetch;
};
const closeModal = () => {
  document.querySelector('.dialog-modal')?.querySelector('.dialog-close').dispatchEvent(new Event('click'));
};

describe('GeoRouting', () => {
  before(() => {
    setUserCountryFromIP();
    stubFetchForGeorouting(true);
    setGeorouting();
  });
  after(() => {
    stubURLSearchParamsGet.reset();
    restoreFetch();
  });
  afterEach(() => {
    document.cookie = 'international=; expires= Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'georouting=; expires= Thu, 01 Jan 1970 00:00:00 GMT';
    closeModal();
  });

  it('Will read undefined if attempting to read unset cookie', async () => {
    // prepare
    const cookieName = 'test123';
    const testcookie = getCookie(cookieName);
    // assert
    expect(testcookie).to.be.undefined;
  });

  it('Will read cookie value correctly if set', async () => {
    // prepare
    const cookieName = 'test';
    document.cookie = `${cookieName}=test`;
    const testcookie = getCookie(cookieName);
    // assert
    expect(testcookie).to.be.equal('test');
    // cleanup
    document.cookie = 'test=; expires= Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('Does create a modal if detected country from IP is DE and url prefix is US', async () => {
    // prepare
    await init(mockConfig, createTag, getMetadata, loadBlock, loadStyle);
    const modal = document.querySelector('.dialog-modal');
    // assert
    expect(modal).to.not.be.null;
  });

  it('Does not create a modal if international session storage exists with US IP.', async () => {
    // prepare
    setUserCountryFromIP('US');
    document.cookie = 'international=us;path=/;';
    await init(mockConfig, createTag, getMetadata, loadBlock, loadStyle);
    const modal = document.querySelector('.dialog-modal');
    // assert
    expect(modal).to.be.null;
    // cleanup
    setUserCountryFromIP();
  });

  it('If aiming for de page and storage is de no modal is shown', async () => {
    // prepare
    mockConfig.locale.prefix = 'de';
    document.cookie = 'international=de;path=/;';
    await init(mockConfig, createTag, getMetadata, loadBlock, loadStyle);
    const modal = document.querySelector('.dialog-modal');
    // assert
    mockConfig.locale.prefix = '';
    expect(modal).to.be.null;
  });

  it('If IP is from an unknown country no modal is show', async () => {
    // prepare
    setUserCountryFromIP('NOEXIST');
    await init(mockConfig, createTag, getMetadata, loadBlock, loadStyle);
    const modal = document.querySelector('.dialog-modal');
    // assert
    expect(modal).to.be.null;
    // cleanup
    setUserCountryFromIP('DE');
  });

  it('Will not display modal if no single link was found and if fallback routing is off', async () => {
    // prepare
    stubFallbackMetadata('off');
    stubHeadRequestToReturnVal('/de', false);
    await init(mockConfig, createTag, getMetadata, loadBlock, loadStyle);
    const modal = document.querySelector('.dialog-modal');
    // assert
    expect(modal).to.be.null;
    // cleanup
    stubFallbackMetadata('on');
    stubHeadRequestToReturnVal('/de', true);
  });

  it('Sets international and georouting_presented cookies on link click in modal', async () => {
    // prepare
    await init(mockConfig, createTag, getMetadata, loadBlock, loadStyle);
    const modal = document.querySelector('.dialog-modal');
    const cookie = getCookie('international');
    // assert
    expect(modal).to.not.be.null;
    expect(cookie).to.be.undefined;
    const links = modal.querySelectorAll('a');
    expect(links).to.not.be.null;
    expect(links[0].text).to.be.equal(mockGeoroutingJson.georouting.data.find((d) => d.prefix === 'de').button);
    links[1].click();
    expect(getCookie('international')).to.be.equal('us');
  });

  it('Does not open georouting modal if georouting hide is active', async () => {
    // prepare
    setGeorouting('off');
    await init(mockConfig, createTag, getMetadata, loadBlock, loadStyle);
    const modal = document.querySelector('.dialog-modal');
    // assert
    expect(modal).to.be.null;
    // cleanup
    setGeorouting('on');
  });

  it('Will load georouting even if georoutingv2 and georouting file is not found', async () => {
    stubFetchForGeorouting(false);
    stubFetchForGeoroutingOld(false);
    stubFetchForFederalGeorouting();
    await init(mockConfig, createTag, getMetadata, loadBlock, loadStyle);
    const modal = document.querySelector('.dialog-modal');
    expect(modal).to.not.be.null;
  });

  it('Will load old georouting modal if georoutingv2 is not found', async () => {
    stubFetchForGeorouting(false);
    stubFetchForGeoroutingOld(true);
    await init(mockConfig, createTag, getMetadata, loadBlock, loadStyle);
    const modal = document.querySelector('.dialog-modal');
    expect(modal).to.not.be.null;
  });
// });
});
