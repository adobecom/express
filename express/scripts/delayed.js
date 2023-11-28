import {
  fetchPlaceholders,
  createTag,
  getDevice,
  getMetadata,
} from './utils.js';

export const loadExpressProduct = async () => {
  if (!window.hlx.preload_product) return;
  if (getDevice() !== 'desktop') return;
  const path = ['www.adobe.com'].includes(window.location.hostname)
    ? 'https://new.express.adobe.com/static/preload.html' : 'https://stage.projectx.corp.adobe.com/static/preload.html';
  const iframe = createTag('iframe', { src: path, style: 'display:none' });
  document.body.append(iframe);
};

async function isLoggedInDelayed() {
  const userProfile = window.adobeProfile?.getUserProfile();
  const placeholders = await fetchPlaceholders();
  const autoRedirect = ['yes', 'true', 'Y', 'on'].includes(getMetadata('direct-path-to-product'));
  const autoRedirectLanguageFound = placeholders.cancel || placeholders['bmtp-header'] || placeholders['bmtp-cancel-text'];
  const isDesktop = getDevice() !== 'desktop';

  return userProfile && autoRedirect && autoRedirectLanguageFound && isDesktop;
}

/**
 * Executes everything that happens a lot later, without impacting the user experience.
 */
export default function loadDelayed(DELAY = 3000) {
  isLoggedInDelayed().then(async (bringMeToProduct) => {
    if (bringMeToProduct) {
      const { default: loadLoginUserAutoRedirect } = await import('../features/direct-path-to-product/direct-path-to-product.js');
      return new Promise((resolve) => {
        loadExpressProduct();
        setTimeout(() => {
          loadLoginUserAutoRedirect();
          resolve();
        }, DELAY);
      });
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        loadExpressProduct();
        resolve();
      }, DELAY);
    });
  });
}
