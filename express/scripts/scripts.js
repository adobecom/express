import {
  sampleRUM,
  getDevice,
  removeIrrelevantSections,
  loadArea,
  stamp,
  registerPerformanceLogger,
} from './utils.js';

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

(async function loadPage() {
  if (window.hlx.init || window.isTestEnv) return;
  await loadArea();
}());

stamp('start');

if (window.name.includes('performance')) registerPerformanceLogger();
