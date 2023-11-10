import {
  loadScript,
  getHelixEnv,
  sampleRUM,
  getCookie,
  getMetadata,
  fetchPlaceholders,
  loadCSS,
  getConfig,
// eslint-disable-next-line import/no-unresolved
} from './utils.js';

const isHomepage = window.location.pathname.endsWith('/express/');

async function checkRedirect(location, geoLookup) {
  const splits = location.pathname.split('/express/');
  splits[0] = '';
  const prefix = geoLookup && geoLookup !== 'us' ? `/${geoLookup}` : '';

  // remove ?geocheck param
  const params = new URLSearchParams(location.search);
  params.delete('geocheck');
  const queryString = params.toString() ? `?${params.toString()}` : '';

  return `${prefix}${splits.join('/express/')}${queryString}${location.hash}`;
}

async function checkGeo(userGeo, userLocale, geoCheckForce) {
  const geoLookup = async () => {
    let region = '';
    const resp = await fetch('/express/system/geo-map.json');
    const json = await resp.json();
    const matchedGeo = json.data.find((row) => (row.usergeo === userGeo));
    const { userlocales, redirectlocalpaths, redirectdefaultpath } = matchedGeo;
    region = redirectdefaultpath;

    if (userlocales) {
      const redirectLocalPaths = redirectlocalpaths.split(',');
      const [userLanguage] = userLocale.split('-');
      const userExpectedPath = `${userGeo.toLowerCase()}_${userLanguage}`;
      region = redirectLocalPaths.find((locale) => locale.trim() === userExpectedPath) || region;
    }
    return (region);
  };

  const region = geoCheckForce ? await geoLookup() : getCookie('international') || await geoLookup();
  return checkRedirect(window.location, region);
}

function loadIMS() {
  window.adobeid = {
    client_id: 'MarvelWeb3',
    scope: 'AdobeID,openid',
    locale: getConfig().locale.region,
    environment: 'prod',
  };
  if (!['www.stage.adobe.com'].includes(window.location.hostname)) {
    loadScript('https://auth.services.adobe.com/imslib/imslib.min.js');
  } else {
    loadScript('https://auth-stg1.services.adobe.com/imslib/imslib.min.js');
    window.adobeid.environment = 'stg1';
  }
}

async function loadFEDS() {
  const config = getConfig();
  const { prefix } = config.locale;

  async function showRegionPicker() {
    const { getModal } = await import('../blocks/modal/modal.js');
    const details = {
      path: '/express/fragments/regions',
      id: 'langnav',
    };
    loadCSS('/express/blocks/modal/modal.css');
    return getModal(details);
  }

  function handleConsentSettings() {
    try {
      if (!window.adobePrivacy || window.adobePrivacy.hasUserProvidedCustomConsent()) {
        window.sprk_full_consent = false;
        return;
      }
      if (window.adobePrivacy.hasUserProvidedConsent()) {
        window.sprk_full_consent = true;
      } else {
        window.sprk_full_consent = false;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Couldn't determine user consent status:", e);
      window.sprk_full_consent = false;
    }
  }

  window.addEventListener('adobePrivacy:PrivacyConsent', handleConsentSettings);
  window.addEventListener('adobePrivacy:PrivacyReject', handleConsentSettings);
  window.addEventListener('adobePrivacy:PrivacyCustom', handleConsentSettings);

  const isMegaNav = window.location.pathname.startsWith('/express')
    || window.location.pathname.startsWith('/in/express')
    || window.location.pathname.startsWith('/uk/express')
    || window.location.pathname.startsWith('/education')
    || window.location.pathname.startsWith('/uk/education')
    || window.location.pathname.startsWith('/drafts');
  const fedsExp = isMegaNav
    ? 'adobe-express/ax-gnav-x'
    : 'adobe-express/ax-gnav-x-row';

  async function buildBreadCrumbArray() {
    if (isHomepage || getMetadata('hide-breadcrumbs') === 'true') {
      return null;
    }
    const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);
    const buildBreadCrumb = (path, name, parentPath = '') => (
      { title: capitalize(name), url: `${parentPath}/${path}` }
    );

    const placeholders = await fetchPlaceholders();
    const validSecondPathSegments = ['create', 'feature'];
    const pathSegments = window.location.pathname
      .split('/')
      .filter((e) => e !== '')
      .filter((e) => e !== prefix);
    const localePath = prefix === '' ? '' : `${prefix}/`;
    const secondPathSegment = pathSegments[1].toLowerCase();
    const pagesShortNameElement = document.head.querySelector('meta[name="short-title"]');
    const pagesShortName = pagesShortNameElement?.getAttribute('content') ?? null;
    const replacedCategory = placeholders[`breadcrumbs-${secondPathSegment}`]?.toLowerCase();

    if (!pagesShortName
      || pathSegments.length <= 2
      || !replacedCategory
      || !validSecondPathSegments.includes(replacedCategory)
      || prefix !== '') { // Remove this line once locale translations are complete
      return null;
    }

    const secondBreadCrumb = buildBreadCrumb(secondPathSegment, capitalize(replacedCategory), `${localePath}/express`);
    const breadCrumbList = [secondBreadCrumb];

    if (pathSegments.length >= 3) {
      const thirdBreadCrumb = buildBreadCrumb(pagesShortName, pagesShortName, secondBreadCrumb.url);
      breadCrumbList.push(thirdBreadCrumb);
    }
    return breadCrumbList;
  }

  window.fedsConfig = {
    ...(window.fedsConfig || {}),

    footer: {
      regionModal: () => {
        showRegionPicker();
      },
    },
    locale: (prefix === '' ? 'en' : prefix),
    content: {
      experience: getMetadata('gnav') || fedsExp,
    },
    profile: {
      customSignIn: () => {
        const sparkLang = config.locale.ietf;
        const sparkPrefix = sparkLang === 'en-US' ? '' : `/${sparkLang}`;
        let sparkLoginUrl = `https://express.adobe.com${sparkPrefix}/sp/`;
        const env = getHelixEnv();
        if (env && env.spark) {
          sparkLoginUrl = sparkLoginUrl.replace('express.adobe.com', env.spark);
        }
        if (isHomepage || sparkPrefix.includes('en-GB')) {
          sparkLoginUrl = 'https://new.express.adobe.com/?showCsatOnExportOnce=True&promoid=GHMVYBFM&mv=other';
        }
        window.location.href = sparkLoginUrl;
      },
    },
    jarvis: getMetadata('enable-chat') === 'yes'
      ? {
        surfaceName: 'AdobeExpressEducation',
        surfaceVersion: '1',
      }
      : {},
    breadcrumbs: {
      showLogo: true,
      links: await buildBreadCrumbArray(),
    },
  };

  window.addEventListener('feds.events.experience.loaded', async () => {
    document.querySelector('body').classList.add('feds-loaded');
    /* attempt to switch link */
    if (window.location.pathname.includes('/create/')
      || window.location.pathname.includes('/discover/')
      || window.location.pathname.includes('/feature/')) {
      const $aNav = document.querySelector('header a.feds-navLink--primaryCta');
      const $aHero = document.querySelector('main > div:first-of-type a.button.accent');
      if ($aNav && $aHero) {
        $aNav.href = $aHero.href;
      }
    }

    /* switch all links if lower env */
    const env = getHelixEnv();
    if (env && env.spark) {
      // eslint-disable-next-line no-console
      // console.log('lower env detected');
      document.querySelectorAll('a[href^="https://spark.adobe.com/"]').forEach(($a) => {
        const hrefURL = new URL($a.href);
        hrefURL.host = env.spark;
        $a.setAttribute('href', hrefURL.toString());
      });
      document.querySelectorAll('a[href^="https://express.adobe.com/"]').forEach(($a) => {
        const hrefURL = new URL($a.href);
        hrefURL.host = env.spark;
        $a.setAttribute('href', hrefURL.toString());
      });
    }

    const geocheck = new URLSearchParams(window.location.search).get('geocheck');
    if (geocheck === 'on' || geocheck === 'force') {
      const userGeo = window.feds
      && window.feds.data
      && window.feds.data.location
      && window.feds.data.location.country
        ? window.feds.data.location.country : null;
      const navigatorLocale = navigator.languages
      && navigator.languages.length
        ? navigator.languages[0].toLowerCase()
        : navigator.language.toLowerCase();
      const redirect = await checkGeo(userGeo, navigatorLocale, geocheck === 'force');
      if (redirect) {
        window.location.href = redirect;
      }
    }
    /* region based redirect to homepage */
    if (window.feds && window.feds.data && window.feds.data.location && window.feds.data.location.country === 'CN') {
      const regionpath = prefix === '' ? '/' : `/${prefix}/`;
      window.location.href = regionpath;
    }
  });
  let domain = '';
  if (!['www.adobe.com', 'www.stage.adobe.com'].includes(window.location.hostname)) {
    domain = 'https://www.adobe.com';
  }
  loadScript(`${domain}/etc.clientlibs/globalnav/clientlibs/base/feds.js`).then((script) => {
    script.id = 'feds-script';
  });
  setTimeout(() => {
    window.fedsConfig.privacy = {
      otDomainId: '7a5eb705-95ed-4cc4-a11d-0cc5760e93db',
    };
    loadScript('https://www.adobe.com/etc.clientlibs/globalnav/clientlibs/base/privacy-standalone.js');
  }, 0);
  const footer = document.querySelector('footer');
  footer?.addEventListener('click', (event) => {
    if (event.target.closest('a[data-feds-action="open-adchoices-modal"]')) {
      event.preventDefault();
      window.adobePrivacy?.showPreferenceCenter();
    }
  });
}

if (!window.hlx || window.hlx.gnav) {
  loadIMS();
  loadFEDS();
  setTimeout(() => {
    import('./google-yolo.js').then((mod) => {
      mod.default();
    });
  }, 4000);
}
/* Core Web Vitals RUM collection */

sampleRUM('cwv');
