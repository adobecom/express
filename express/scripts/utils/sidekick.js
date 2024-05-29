import { createTag, loadBlock } from '../utils.js';

export function autoWidgetByUSP(name, callback) {
  const usp = new URLSearchParams(window.location.search);
  const qaIndex = parseInt(usp.get(name), 10);

  if (qaIndex) {
    callback();
  }
}

const localeFlowListener = async () => {
  const localeFlow = createTag('div', { class: 'locale-flow', 'data-block-name': 'locale-flow' });
  const content = await loadBlock(localeFlow);

  const { getModal } = await import('../../blocks/modal/modal.js');
  getModal(null, { id: 'locale-flow', content, closeEvent: 'closeModal' });
};

export default function init() {
  const preflightListener = async () => {
    const preflight = createTag('div', { class: 'preflight', 'data-block-name': 'preflight' });
    const content = await loadBlock(preflight);

    const { getModal } = await import('../../blocks/modal/modal.js');
    getModal(null, { id: 'preflight', content, closeEvent: 'closeModal' });
  };

  const launchQAGuide = async () => {
    const { default: initQAGuide } = await import('../features/qa-guide/qa-guide.js');
    initQAGuide();
  };

  const sk = document.querySelector('helix-sidekick');

  // Auto plugins
  autoWidgetByUSP('qaprogress', () => {
    launchQAGuide();
  });

  // Add plugin listeners here
  sk.addEventListener('custom:qa-guide', launchQAGuide);
  sk.addEventListener('custom:preflight', preflightListener);
  sk.addEventListener('custom:locale-flow', localeFlowListener);
}
