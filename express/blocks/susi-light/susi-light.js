/* eslint-disable no-underscore-dangle */
// WIP
import {
  createTag,
  loadScript,
  getConfig,
} from '../../scripts/utils.js';

const config = {
  consentProfile: 'free', // FIXME: to be finalized
};
const variant = 'edu-express';
const usp = new URLSearchParams(window.location.search);
const isStage = usp.get('env') !== 'prod' || getConfig().env.name !== 'prod';
const CDN_URL = `https://auth-light.identity${isStage ? '-stage' : ''}.adobe.com/sentry/wrapper.js`;
// eslint-disable-next-line camelcase
const client_id = usp.get('test_id') === 'on' ? 'sentry-test-edu' : 'AdobeExpressWeb';
const authParams = {
  dt: false,
  locale: getConfig().locale.ietf.toLowerCase(),
  response_type: 'code', // FIXME: to be finalized
  client_id,
  scope: 'AdobeID,openid',
  state: '?source=atc&role=teacher',
};
const onRedirect = (e) => {
  // eslint-disable-next-line no-console
  console.log('redirecting to:', e.detail);
  window.location.assign(e.detail);
};
const onToken = (e) => {
  // eslint-disable-next-line no-console
  console.log('susi on token', e); // FIXME: to be removed
};
const onError = (e) => {
  window.lana?.log('on error:', e);
};

function safelyFireAnalyticsEvent(event) {
  if (window._satellite?.track) {
    event();
  } else {
    window.addEventListener('alloy_sendEvent', () => {
      event();
    }, { once: true });
  }
}

function sendEventToAnalytics(type, eventName) {
  const fireEvent = () => {
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
  safelyFireAnalyticsEvent(fireEvent);
}

// TODO: add UT for analytcis
const onAnalytics = (e) => {
  const { type, event } = e.detail;
  sendEventToAnalytics(type, event);
};

export default async function init(el) {
  const input = el.querySelector('div > div')?.textContent?.trim().toLowerCase();
  let destURL;
  try {
    destURL = new URL(input);
  } catch (err) {
    window.lana?.log(`invalid redirect uri authored for susi-light: ${input}`);
    destURL = new URL('https://express.adobe.com');
  }
  if (isStage && destURL.hostname === 'express.adobe.com') {
    destURL.hostname = 'stage.projectx.corp.adobe.com';
  }
  el.innerHTML = '';
  await loadScript(CDN_URL);
  const susi = createTag('susi-sentry-light');
  susi.authParams = authParams;
  susi.authParams.redirect_uri = destURL.toString();
  susi.config = config;
  if (isStage) susi.stage = 'true';
  susi.variant = variant;
  susi.addEventListener('redirect', onRedirect);
  susi.addEventListener('on-token', onToken);
  susi.addEventListener('on-error', onError);
  susi.addEventListener('on-analytics', onAnalytics);
  el.append(susi);
}
