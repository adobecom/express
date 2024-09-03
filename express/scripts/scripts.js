import {
  sampleRUM,
  loadArea,
  loadLana,
  getMetadata,
  stamp,
  registerPerformanceLogger,
  setConfig,
  createTag,
  getConfig,
  decorateArea,
} from './utils.js';

const locales = {
  '': { ietf: 'en-US', tk: 'jdq5hay.css' },
  br: { ietf: 'pt-BR', tk: 'inq1xob.css' },
  cn: { ietf: 'zh-Hans-CN', tk: 'puu3xkp' },
  de: { ietf: 'de-DE', tk: 'vin7zsi.css' },
  dk: { ietf: 'da-DK', tk: 'aaz7dvd.css' },
  eg: { ietf: 'en-EG', tk: 'pps7abe.css' },
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

let jarvisImmediatelyVisible = false;
const jarvisVisibleMeta = getMetadata('jarvis-immediately-visible')?.toLowerCase();
const desktopViewport = window.matchMedia('(min-width: 900px)').matches;
if (jarvisVisibleMeta && ['mobile', 'desktop', 'on'].includes(jarvisVisibleMeta) && (
  (jarvisVisibleMeta === 'mobile' && !desktopViewport) || (jarvisVisibleMeta === 'desktop' && desktopViewport))) jarvisImmediatelyVisible = true;

const config = {
  local: { express: 'stage.projectx.corp.adobe.com', commerce: 'commerce-stg.adobe.com' },
  stage: { express: 'stage.projectx.corp.adobe.com', commerce: 'commerce-stg.adobe.com' },
  prod: { express: 'express.adobe.com', commerce: 'commerce.adobe.com' },
  locales,
  codeRoot: '/express',
  contentRoot: '/express',
  jarvis: {
    id: 'Acom_Express',
    version: '1.0',
    onDemand: !jarvisImmediatelyVisible,
  },
  links: 'on',
  decorateArea,
  imsClientId: 'AdobeExpressWeb',
  imsScope: 'AdobeID,openid,pps.read,firefly_api,additional_info.roles,read_organizations',
};

window.RUM_GENERATION = 'ccx-gen-4-experiment-high-sample-rate';
window.RUM_LOW_SAMPLE_RATE = 100;
window.RUM_HIGH_SAMPLE_RATE = 50;

window.dataLayer = window.dataLayer || [];

sampleRUM('top');

window.addEventListener('load', () => sampleRUM('load'));
document.addEventListener('click', () => sampleRUM('click'));

const usp = new URLSearchParams(window.location.search);
window.spark = {};
window.spark.hostname = usp.get('hostname') || window.location.hostname;

const eagerLoad = (img) => {
  img?.setAttribute('loading', 'eager');
  img?.setAttribute('fetchpriority', 'high');
};

(function handleSplit() {
  const { userAgent } = navigator;
  document.body.dataset.device = userAgent.includes('Mobile') ? 'mobile' : 'desktop';
  const fqaMeta = createTag('meta', { content: 'on' });
  if (document.body.dataset.device === 'mobile'
    || (/Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS|Edg|OPR|Opera|OPiOS|Vivaldi|YaBrowser|Avast|VivoBrowser|GSA/.test(userAgent))) {
    fqaMeta.setAttribute('name', 'fqa-off');
  } else {
    fqaMeta.setAttribute('name', 'fqa-on');
  }
  document.head.append(fqaMeta);
}());

decorateArea();

(function loadLCPImage() {
  const main = document.body.querySelector('main');
  const firstDiv = main.querySelector('div:nth-child(1) > div');
  if (firstDiv?.classList.contains('marquee')) {
    firstDiv.querySelectorAll('img').forEach(eagerLoad);
  } else {
    eagerLoad(document.querySelector('img'));
  }
}());

const loadExpressMartechSettings = () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('martech') !== 'off' || getMetadata('martech') === 'off') {
    const handler = () => {
      import('./instrument.js').then((mod) => {
        mod.default();
      });
    };
    window.addEventListener('express:LCP:loaded', handler);
  }
};

const listenAlloy = () => {
  let resolver;
  let loaded;
  const t1 = performance.now();
  window.alloyLoader = new Promise((r) => {
    resolver = r;
  });
  window.addEventListener('alloy_sendEvent', (e) => {
    if (e.detail.type === 'pageView') {
      // eslint-disable-next-line no-console
      if (usp.has('debug-alloy')) console.log(`Alloy loaded in ${performance.now() - t1}`);
      loaded = true;
      resolver(e.detail.result);
    }
  }, { once: true });
  setTimeout(() => {
    if (!loaded) {
      window.lana.log(`Alloy failed to load, waited ${performance.now() - t1}`, { sampleRate: 0.01 });
      resolver();
    }
  }, 3000);
};

function registerSUSIModalLinks() {
  const container = createTag('div', {}, `
    <div>
      <a href='https://www.adobe.com/express/fragments/susi-light-teacher#susi-light-1' rel: 'nofollow'></a>
    </div>`);
  container.style = 'display:none;position:absolute';
  const main = document.querySelector('main');
  const lastDiv = main.querySelector(':scope > div:last-of-type');
  lastDiv.childElementCount === 0 ? main.insertBefore(container, lastDiv) : main.append(container);
}

(async function loadPage() {
  if (window.hlx.init || window.isTestEnv) return;
  window.hlx = window.hlx || {};
  const params = new URLSearchParams(window.location.search);
  const experimentParams = params.get('experiment');
  ['martech', 'gnav', 'testing', 'preload_product'].forEach((p) => {
    window.hlx[p] = params.get('lighthouse') !== 'on' && params.get(p) !== 'off';
  });
  window.hlx.experimentParams = experimentParams;
  window.hlx.init = true;
  setConfig(config);

  if (getMetadata('hide-breadcrumbs') !== 'true' && !getMetadata('breadcrumbs') && !window.location.pathname.endsWith('/express/')) {
    const meta = createTag('meta', { name: 'breadcrumbs', content: 'on' });
    document.head.append(meta);
    import('./gnav.js').then((gnav) => gnav.buildBreadCrumbArray(getConfig().locale.prefix.replaceAll('/', ''))).then((breadcrumbs) => {
      if (breadcrumbs && breadcrumbs.length) document.body.classList.add('breadcrumbs-spacing');
    });
  } else if (getMetadata('breadcrumbs') === 'on' && !!getMetadata('breadcrumbs-base') && (!!getMetadata('short-title') || !!getMetadata('breadcrumbs-page-title'))) document.body.classList.add('breadcrumbs-spacing');
  loadExpressMartechSettings();
  loadLana({ clientId: 'express' });
  listenAlloy();
  registerSUSIModalLinks(); // TODO: remove post bts
  await loadArea();

  import('./express-delayed.js').then((mod) => {
    mod.default();
  });
}());

stamp('start');

if (window.name.includes('performance')) registerPerformanceLogger();
