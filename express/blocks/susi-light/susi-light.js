/* eslint-disable no-unused-vars */
// WIP
import { createTag, loadScript, getConfig } from '../../scripts/utils.js';

const CDN_URL = 'https://auth-light.identity-stage.adobe.com/sentry/wrapper.js';

const authParams = {
  dt: false,
  locale: getConfig().locale.ietf.toLowerCase(),
  response_type: 'code', // FIXME:
  // client_id: 'AdobeExpressWeb',
  client_id: 'sentry-test-edu',
  scope: 'AdobeID,openid',
};
const config = {
  consentProfile: 'free', // FIXME:
};
const isPopup = true; // FIXME:
const variant = 'edu-express';
const onRedirect = (e) => {
  console.log('on redirect');
};
const onToken = (e) => {
  console.log('on token');
};
const onError = (e) => {
  console.log('on error:', e);
};

export default async function init(el) {
  // const preload = createTag('meta', {
  //   name: 'susi-sentry-preload',
  //   content: 'edu-express',
  //   'data-locale': getConfig().locale.ietf.toLowerCase(),
  // });
  // document.head.appendChild(preload);
  const redirectUri = el.querySelector('div > div')?.textContent?.trim().toLowerCase() ?? '';
  el.innerHTML = '';
  await loadScript(CDN_URL);
  const susi = createTag('susi-sentry-light', {
    popup: isPopup,
    variant,
  });
  susi.variant = variant;
  susi.authParams = authParams;
  susi.authParams.redirect_uri = redirectUri ? encodeURIComponent(redirectUri) : 'https://new.express.adobe.com/';
  susi.config = config;
  susi.stage = 'true';
  susi.setAttribute('stage', 'true');
  susi.addEventListener('redirect', onRedirect);
  susi.addEventListener('on-token', onToken);
  susi.addEventListener('on-error', onError);
  el.append(susi);
}
