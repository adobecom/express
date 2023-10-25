/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import BlockMediator from './block-mediator.js';

export const loadExpressProduct = async (createTag) => {
  if (!window.hlx.preload_product) return;
  const path = ['www.adobe.com'].includes(window.location.hostname)
    ? 'https://new.express.adobe.com/static/preload.html' : 'https://stage.projectx.corp.adobe.com/static/preload.html';
  const iframe = createTag('iframe', { src: path, style: 'display:none' });
  document.body.append(iframe);
};

async function loadLoginUserAutoRedirect(createTag, getIconElement) {
  let followThrough = true;

  const buildRedirectAlert = async (profile) => {
    const container = createTag('div', { class: 'bmtp-container' });
    const headerWrapper = createTag('div', { class: 'bmtp-header' });
    const headerIcon = createTag('div', { class: 'bmtp-header-icon' }, getIconElement('cc-express'));
    const headerText = createTag('span', { class: 'bmtp-header-text' }, 'Taking you to Adobe Express');
    const progressBg = createTag('div', { class: 'bmtp-progress-bg' });
    const progressBar = createTag('div', { class: 'bmtp-progress-bar' });
    const profileWrapper = createTag('div', { class: 'profile-wrapper' });
    const profilePhotoCont = createTag('div', { class: 'profile-img-container' });
    // fixme: to remove after finding out how to get thumbnail
    const profilePhoto = createTag('img', { src: 'https://a5.behance.net/da4a198db4e0fae89fe4c1adaab3972c89aef95d/img/profile/avatars/selection-138.png?cb=264615658' });
    const profileTextWrapper = createTag('div', { class: 'profile-text-wrapper' });
    const profileName = createTag('strong', { class: 'profile-name' }, profile.displayName);
    const profileEmail = createTag('span', { class: 'profile-email' }, profile.email);
    const noticeWrapper = createTag('div', { class: 'notice-wrapper' });
    const noticeText = createTag('span', { class: 'notice-text' }, 'Cancel to stay on the page');
    const noticeBtn = createTag('a', { class: 'notice-btn' });

    noticeBtn.textContent = 'Cancel';
    const photoInGNav = document.querySelector('header .Profile-thumbnail');
    if (photoInGNav) {
      [, profilePhoto.src] = photoInGNav.style.backgroundImage.match('url\\("([^"]+)"\\)');
    }

    headerWrapper.append(headerIcon, headerText);
    progressBg.append(progressBar);
    profilePhotoCont.append(profilePhoto);
    profileWrapper.append(profilePhotoCont, profileTextWrapper);
    profileTextWrapper.append(profileName, profileEmail);
    noticeWrapper.append(noticeText, noticeBtn);
    container.append(headerWrapper, progressBg, profileWrapper, noticeWrapper);

    const header = document.querySelector('header');
    header.append(container);

    noticeBtn.addEventListener('click', () => {
      container.remove();
      followThrough = false;
      localStorage.setItem('no-bmtp', '3');
    });

    return container;
  };

  const initRedirect = (container) => {
    if (!followThrough) return;

    container.classList.add('done');

    const primaryCtaUrl = BlockMediator.get('primaryCtaUrl')
      || document.querySelector('a.button.xlarge.same-as-floating-button-CTA, a.primaryCTA')?.href;

    if (primaryCtaUrl) {
      window.location.assign(primaryCtaUrl);
    } else {
      window.assign('https://new.express.adobe.com');
    }
  };

  // const profile = await window.feds.utilities.imslib.getProfile();

  // todo: mock. remove before deploy
  const profile = {
    account_type: 'type3',
    utcOffset: 'null',
    preferred_languages: null,
    displayName: 'Qiyun Dai',
    last_name: 'Dai',
    userId: 'F8B907856306C4BB0A495E20@adobe.com',
    authId: 'F8B907856306C4BB0A495E20@adobe.com',
    tags: [
      'agegroup_unknown',
      'edu',
    ],
    emailVerified: 'true',
    phoneNumber: null,
    countryCode: 'US',
    name: 'Qiyun Dai',
    mrktPerm: '',
    mrktPermEmail: null,
    first_name: 'Qiyun',
    email: 'web87753@adobe.com',
  };

  const optOutCounter = localStorage.getItem('no-bmtp');
  if (!optOutCounter || optOutCounter === '0') {
    const container = await buildRedirectAlert(profile);
    setTimeout(() => {
      if (container) initRedirect(container);
    }, 2000);
  }

  if (optOutCounter && optOutCounter !== '0') {
    const counterNumber = parseInt(optOutCounter, 10);
    localStorage.setItem('no-bmtp', (counterNumber - 1).toString());
  }
}

export function loadDelayedLoggedIn([
  createTag,
  getIconElement,
], DELAY = 3000) {
  return new Promise((resolve) => {
    loadExpressProduct(createTag);
    setTimeout(() => {
      loadLoginUserAutoRedirect(createTag, getIconElement);
      resolve();
    }, DELAY);
  });
}

/**
 * Executes everything that happens a lot later, without impacting the user experience.
 */
export default function loadDelayed([
  createTag,
], DELAY = 3000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      loadExpressProduct(createTag);
      resolve();
    }, DELAY);
  });
}
