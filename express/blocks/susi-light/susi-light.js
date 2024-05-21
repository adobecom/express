/* eslint-disable no-unused-vars */
// WIP
import { createTag, loadScript } from '../../scripts/utils.js';

const CDN_URL = 'https://auth-light.identity.adobe.com/sentry/wrapper.js';

const authParams = {
  dt: false,
  locale: 'en-us',
  redirect_uri: 'https://new.express.adobe.com/', // FIXME:
  response_type: 'code', // FIXME:
  client_id: 'AdobeExpressWeb',
  scope: 'AdobeID,openid',
};
const config = {
  consentProfile: 'free', // FIXME:
};
const isPopup = true; // FIXME:
const variant = 'edu-express'; // FIXME:
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
  el.innerHTML = '';
  // await loadScript(CDN_URL);
  const susi = createTag('susi-sentry-light', {
    popup: isPopup,
    variant,
  });
  susi.authParams = authParams;
  susi.config = config;
  susi.addEventListener('redirect', onRedirect);
  susi.addEventListener('on-token', onToken);
  susi.addEventListener('on-error', onError);
  el.append(susi);
  await loadScript(CDN_URL);
}
