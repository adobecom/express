import {
  sampleRUM,
  getDevice,
  removeIrrelevantSections,
  loadArea,
  stamp,
  registerPerformanceLogger,
  setConfig,
  loadStyle,
} from './utils.js';

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
  in: { ietf: 'en-IN', tk: 'pps7abe.css' },
  it: { ietf: 'it-IT', tk: 'bbf5pok.css' },
  jp: { ietf: 'ja-JP', tk: 'dvg6awq' },
  kr: { ietf: 'ko-KR', tk: 'qjs5sfm' },
  nl: { ietf: 'nl-NL', tk: 'cya6bri.css' },
  no: { ietf: 'no-NO', tk: 'aaz7dvd.css' },
  se: { ietf: 'sv-SE', tk: 'fpk1pcd.css' },
  tw: { ietf: 'zh-Hant-TW', tk: 'jay0ecd' },
  uk: { ietf: 'en-GB', tk: 'pps7abe.css' },
};

const config = {
  locales,
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

(function loadLCPImage() {
  const body = document.querySelector('body');
  body.dataset.device = getDevice();
  const main = body.querySelector('main');
  removeIrrelevantSections(main);
  const firstDiv = main.querySelector('div:nth-child(1) > div');
  if (firstDiv?.classList.contains('marquee')) {
    firstDiv.querySelectorAll('img').forEach(eagerLoad);
  } else {
    eagerLoad(document.querySelector('img'));
  }
}());

const showNotifications = () => {
  const url = new URL(window.location.href);
  const notification = url.searchParams.get('notification');
  if (notification) {
    const handler = () => {
      loadStyle('/express/features/notification/notification.css', () => {
        import('../features/notification/notification.js').then((mod) => {
          mod.default(notification);
          window.removeEventListener('milo:LCP:loaded', handler);
        });
      });
    };
    window.addEventListener('milo:LCP:loaded', handler);
  }
};

(async function loadPage() {
  if (window.hlx.init || window.isTestEnv) return;
  setConfig(config);
  showNotifications();
  await loadArea();
}());

stamp('start');

if (window.name.includes('performance')) registerPerformanceLogger();
