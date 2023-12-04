import { createTag, loadBlock } from '../utils.js';

const QA_GUIDE_FILE_LOCATION = '/docs/qa-guide.plain.html';

export function autoWidgetByUSP(name, callback) {
  const usp = new URLSearchParams(window.location.search);
  const qaIndex = parseInt(usp.get(name), 10);

  if (qaIndex) {
    callback();
  }
}

export default function init() {
  const preflightListener = async () => {
    const preflight = createTag('div', { class: 'preflight', 'data-block-name': 'preflight' });
    const content = await loadBlock(preflight);

    const { getModal } = await import('../../blocks/modal/modal.js');
    getModal(null, { id: 'preflight', content, closeEvent: 'closeModal' });
  };

  const launchQAGuide = async () => {
    const resp = await fetch(QA_GUIDE_FILE_LOCATION);
    if (!resp.ok) return;

    const main = createTag('main');
    main.innerHTML = await resp.text();
    const audience = document.body.dataset?.device;
    let qaGuideEl = main.querySelector('.qa-guide.desktop');
    if (audience) qaGuideEl = main.querySelector(`.qa-guide.${audience}`);

    const { default: initQAGuide } = await import('../features/qa-guide/qa-guide.js');

    initQAGuide(qaGuideEl);
  };

  const sk = document.querySelector('helix-sidekick');

  // Auto plugins
  autoWidgetByUSP('qaprogress', () => {
    launchQAGuide();
    preflightListener();
  });

  // Add plugin listeners here
  sk.addEventListener('custom:qa-guide', launchQAGuide);
  sk.addEventListener('custom:preflight', preflightListener);
}
