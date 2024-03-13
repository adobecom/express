/* global _satellite */

import {
  createTag,
  fetchPlaceholders,
  getIconElement,
  loadStyle,
} from '../../scripts/utils.js';
import { getProfile, getDestination } from '../../scripts/express-delayed.js';

const OPT_OUT_KEY = 'no-direct-path-to-product';

const adobeEventName = 'adobe.com:express:cta:pep';

const REACT_TIME = 4000;

function track(name) {
  try {
    _satellite?.track('event', {
      xdm: {},
      data: {
        eventType: 'web.webinteraction.linkClicks',
        web: {
          webInteraction: {
            name,
            linkClicks: {
              value: 1,
            },
            type: 'other',
          },
        },
        _adobe_corpnew: {
          digitalData: {
            primaryEvent: {
              eventInfo: {
                eventName: name,
              },
            },
          },
        },
      },
    });
  } catch (e) {
    window.lana.log(e);
  }
}

function buildProfileWrapper(profile) {
  const profileWrapper = createTag('div', { class: 'profile-wrapper' });
  const profilePhotoCont = createTag('div', { class: 'profile-img-container' });
  const profilePhoto = createTag('img', { src: profile.avatar });
  const profileTextWrapper = createTag('div', { class: 'profile-text-wrapper' });
  const profileName = createTag('strong', { class: 'profile-name' }, profile.display_name);
  const profileEmail = createTag('span', { class: 'profile-email' }, profile.email);
  profilePhotoCont.append(profilePhoto);
  profileWrapper.append(profilePhotoCont, profileTextWrapper);
  profileTextWrapper.append(profileName, profileEmail);
  return profileWrapper;
}

function initRedirect(container) {
  container.classList.add('done');
  track(`${adobeEventName}:redirect`);
  window.location.assign(getDestination());
}

export default async function loadLoginUserAutoRedirect() {
  let cancel = false;
  const [placeholders] = await Promise.all([
    fetchPlaceholders(),
    new Promise((resolve) => {
      loadStyle('/express/features/direct-path-to-product/direct-path-to-product.css', resolve);
    }),
  ]);

  const buildRedirectAlert = () => {
    const container = createTag('div', { class: 'pep-container' });
    const headerWrapper = createTag('div', { class: 'pep-header' });
    const headerIcon = createTag('div', { class: 'pep-header-icon' }, getIconElement('cc-express'));
    const headerText = createTag('span', { class: 'pep-header-text' }, placeholders['pep-header']);
    const progressBg = createTag('div', { class: 'pep-progress-bg' });
    const progressBar = createTag('div', { class: 'pep-progress-bar' });
    const noticeWrapper = createTag('div', { class: 'notice-wrapper' });
    const noticeText = createTag('span', { class: 'notice-text' }, placeholders['pep-cancel']);
    const noticeBtn = createTag('a', { class: 'notice-btn' }, placeholders.cancel);

    headerWrapper.append(headerIcon, headerText);
    progressBg.append(progressBar);
    noticeWrapper.append(noticeText, noticeBtn);
    container.append(headerWrapper, progressBg);
    const profile = getProfile();
    if (profile) {
      container.append(buildProfileWrapper(profile));
    }
    container.append(noticeWrapper);

    const header = document.querySelector('header');
    header.append(container);

    noticeBtn.addEventListener('click', () => {
      track(`${adobeEventName}:cancel`);
      container.remove();
      cancel = true;
      localStorage.setItem(OPT_OUT_KEY, '3');
    });

    return container;
  };

  const optOutCounter = localStorage.getItem(OPT_OUT_KEY);

  if (optOutCounter && optOutCounter !== '0') {
    const counterNumber = parseInt(optOutCounter, 10);
    localStorage.setItem(OPT_OUT_KEY, (counterNumber - 1).toString());
  } else {
    const container = buildRedirectAlert();
    let startTime = performance.now();
    let remainTime = REACT_TIME;
    let timeoutId;
    let isMouseIn = false;
    const progressBar = container.querySelector('.pep-progress-bar');
    let start;
    const mouseEnter = () => {
      isMouseIn = true;
      clearTimeout(timeoutId);
      const pastTime = performance.now() - startTime;
      remainTime -= pastTime;
      const progress = Math.min(100, ((REACT_TIME - remainTime) / REACT_TIME) * 100);
      progressBar.style.transition = 'none';
      progressBar.style.width = `${progress}%`;
    };
    const mouseLeave = () => {
      if (!isMouseIn) return;
      isMouseIn = false;
      timeoutId = start();
    };
    start = () => {
      startTime = performance.now();
      progressBar.style.transition = `width ${remainTime}ms linear`;
      progressBar.offsetWidth; // forcing a reflow to get more consistent transition
      progressBar.style.width = '100%';
      return setTimeout(() => {
        container.removeEventListener('mouseenter', mouseEnter);
        container.removeEventListener('mouseleave', mouseLeave);
        if (!cancel) initRedirect(container);
      }, remainTime);
    };
    container.addEventListener('mouseenter', mouseEnter);
    container.addEventListener('mouseleave', mouseLeave);
    timeoutId = start();
  }
}
