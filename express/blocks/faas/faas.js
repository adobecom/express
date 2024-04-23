import { createIntersectionObserver } from '../../scripts/utils.js';
import { initFaas, loadFaasFiles } from './utils.js';

const ROOT_MARGIN = 1000;

const b64ToUtf8 = (str) => decodeURIComponent(escape(window.atob(str)));

function parseEncodedConfig(encodedConfig) {
  try {
    return JSON.parse(b64ToUtf8(decodeURIComponent(encodedConfig)));
  } catch (e) {
    // console.log(e);
  }
  return null;
}

const loadFaas = async (a) => {
  await loadFaasFiles();
  const encodedConfig = a.href.split('#')[1];
  const faas = initFaas(parseEncodedConfig(encodedConfig), a);

  // if FaaS is in Modal, make it column2 style.
  if (faas && faas.closest('.dialog-modal')) {
    faas.querySelector('.faas').classList.add('column2');
  }
};

const loadedLinks = new Set();

export default async function init(a) {
  if (loadedLinks.has(a)) return;
  loadedLinks.add(a);
  if (a.textContent.includes('no-lazy')) {
    loadFaas(a);
  } else {
    createIntersectionObserver({
      el: a,
      options: { rootMargin: `${ROOT_MARGIN}px` },
      callback: loadFaas,
      once: true,
    });
  }
}
