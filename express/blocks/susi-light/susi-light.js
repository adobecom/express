/* eslint-disable no-underscore-dangle */
import {
  createTag,
  loadScript,
  getConfig,
} from '../../scripts/utils.js';

const config = {
  consentProfile: 'free',
};
const variant = 'edu-express';
const usp = new URLSearchParams(window.location.search);
const isStage = (usp.get('env') && usp.get('env') !== 'prod') || getConfig().env.name !== 'prod';
// eslint-disable-next-line camelcase
const client_id = 'AdobeExpressWeb';
const authParams = {
  dt: false,
  locale: getConfig().locale.ietf.toLowerCase(),
  response_type: 'code',
  client_id,
  scope: 'AdobeID,openid',
};
const onRedirect = (e) => {
  // eslint-disable-next-line no-console
  console.log('redirecting to:', e.detail);
  window.location.assign(e.detail);
};
const onError = (e) => {
  window.lana?.log('on error:', e);
};

function sendEventToAnalytics(type, eventName) {
  const sendEvent = () => {
    window._satellite.track('event', {
      xdm: {},
      data: {
        eventType: 'web.webinteraction.linkClicks',
        web: {
          webInteraction: {
            name: eventName,
            linkClicks: {
              value: 1,
            },
            type,
          },
        },
        _adobe_corpnew: {
          digitalData: {
            primaryEvent: {
              eventInfo: {
                eventName,
                client_id,
              },
            },
          },
        },
      },
    });
  };
  if (window._satellite?.track) {
    sendEvent();
  } else {
    window.addEventListener('alloy_sendEvent', () => {
      sendEvent();
    }, { once: true });
  }
}

// TODO: analytcis requirements
const onAnalytics = (e) => {
  const { type, event } = e.detail;
  sendEventToAnalytics(type, event);
};

export function loadWrapper() {
  const CDN_URL = `https://auth-light.identity${isStage ? '-stage' : ''}.adobe.com/sentry/wrapper.js`;
  return loadScript(CDN_URL);
}

export default async function init(el) {
  const input = el.querySelector('div > div')?.textContent?.trim().toLowerCase();
  let destURL;
  try {
    destURL = new URL(input);
  } catch (err) {
    window.lana?.log(`invalid redirect uri for susi-light: ${input}`);
    destURL = new URL('https://new.express.adobe.com');
  }
  if (isStage && ['new.express.adobe.com', 'express.adobe.com'].includes(destURL.hostname)) {
    destURL.hostname = 'stage.projectx.corp.adobe.com';
  }
  const goDest = () => window.location.assign(destURL.toString());
  if (window.feds?.utilities?.imslib) {
    const { imslib } = window.feds.utilities;
    imslib.isReady() && imslib.isSignedInUser() && goDest();
    imslib.onReady().then(() => imslib.isSignedInUser() && goDest());
  }
  el.innerHTML = '';
  await loadWrapper();
  const susi = createTag('susi-sentry-light');
  susi.authParams = authParams;
  susi.authParams.redirect_uri = destURL.toString();
  susi.config = config;
  if (isStage) susi.stage = 'true';
  susi.variant = variant;
  susi.addEventListener('redirect', onRedirect);
  susi.addEventListener('on-error', onError);
  susi.addEventListener('on-analytics', onAnalytics);
  el.append(susi);
}
