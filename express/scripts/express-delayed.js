import {
  fetchPlaceholders,
  createTag,
  getMetadata,
} from './utils.js';

export const loadExpressProduct = () => {
  if (!window.hlx.preload_product) return;
  if (document.body.dataset.device === 'mobile') return;
  const path = ['www.adobe.com'].includes(window.location.hostname)
    ? 'https://new.express.adobe.com/static/preload.html' : 'https://stage.projectx.corp.adobe.com/static/preload.html';
  const iframe = createTag('iframe', { src: path, style: 'display:none' });
  document.body.append(iframe);
};

async function shouldBringToProduct() {
  const userProfile = window.adobeProfile?.getUserProfile();
  const placeholders = await fetchPlaceholders();
  const autoRedirect = ['yes', 'true', 'Y', 'on'].includes(getMetadata('direct-path-to-product'));
  const autoRedirectLanguageFound = placeholders.cancel && placeholders['bmtp-header'] && placeholders['bmtp-cancel-text'];
  const isDesktop = document.body.dataset.device === 'desktop';

  return userProfile && autoRedirect && autoRedirectLanguageFound && isDesktop;
}

const PEP_DELAY = 3000;

/**
 * Executes everything that happens a lot later, without impacting the user experience.
 */
export default async function loadDelayed(DELAY = 15000) {
  const bringMeToProduct = await shouldBringToProduct();
  if (bringMeToProduct) {
    const { default: loadLoginUserAutoRedirect } = await import('../features/direct-path-to-product/direct-path-to-product.js');
    return new Promise((resolve) => {
      // TODO: not preloading product this early to protect desktop CWV
      // until we see significant proof of preloading improving product load time
      // loadExpressProduct();
      setTimeout(() => {
        loadLoginUserAutoRedirect();
        resolve();
      }, PEP_DELAY);
    });
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      loadExpressProduct();
      resolve();
    }, window.delay_preload_product ? DELAY * 2 : DELAY);
  });
}
