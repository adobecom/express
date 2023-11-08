export const loadExpressProduct = async (createTag, getDevice) => {
  if (!window.hlx.preload_product) return;
  if (getDevice() !== 'desktop') return;
  const path = ['www.adobe.com'].includes(window.location.hostname)
    ? 'https://new.express.adobe.com/static/preload.html' : 'https://stage.projectx.corp.adobe.com/static/preload.html';
  const iframe = createTag('iframe', { src: path, style: 'display:none' });
  document.body.append(iframe);
};

/**
 * Executes everything that happens a lot later, without impacting the user experience.
 */
export default function loadDelayed([
  createTag,
  getDevice,
], DELAY = 3000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      loadExpressProduct(createTag, getDevice);
      resolve();
    }, DELAY);
  });
}
