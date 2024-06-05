/* eslint-disable no-unused-vars */
// WIP
import {
  createTag,
  loadScript,
  getConfig,
  // getMetadata,
} from '../../scripts/utils.js';

const authParams = {
  dt: false,
  locale: getConfig().locale.ietf.toLowerCase(),
  response_type: 'code', // FIXME: to be finalized
  // client_id: 'AdobeExpressWeb',
  client_id: 'sentry-test-edu',
  scope: 'AdobeID,openid',
};
const config = {
  consentProfile: 'free', // FIXME: to be finalized
};
// const isPopup = true; // FIXME: to be finalized
const variant = 'edu-express';
const isStage = getConfig().env.name !== 'prod';
const CDN_URL = `https://auth-light.identity${isStage ? '-stage' : ''}.adobe.com/sentry/wrapper.js`;
const onRedirect = (e) => {
  console.log('on redirect', e, e.detail);
  console.log('redirecting to: ', e.detail);
  window.location.assign(e.detail);
};
const onToken = (e) => {
  console.log('on token', e);
};
const onError = (e) => {
  console.log('on error:', e);
};

export default async function init(el) {
  const redirectUri = el.querySelector('div > div')?.textContent?.trim().toLowerCase() ?? '';
  el.innerHTML = '';
  await loadScript(CDN_URL);
  const susi = createTag('susi-sentry-light');
  susi.authParams = authParams;
  susi.authParams.redirect_uri = redirectUri ? encodeURIComponent(redirectUri) : 'https://new.express.adobe.com/';
  susi.config = config;
  if (isStage) susi.stage = 'true';
  // susi.popup = 'true';
  susi.variant = variant;
  susi.addEventListener('redirect', onRedirect);
  susi.addEventListener('on-token', onToken);
  susi.addEventListener('on-error', onError);
  el.append(susi);
}
