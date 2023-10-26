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

export const loadExpressProduct = async (delayUtils) => {
  const { createTag } = delayUtils;
  if (!window.hlx.preload_product) return;
  const path = ['www.adobe.com'].includes(window.location.hostname)
    ? 'https://new.express.adobe.com/static/preload.html' : 'https://stage.projectx.corp.adobe.com/static/preload.html';
  const iframe = createTag('iframe', { src: path, style: 'display:none' });
  document.body.append(iframe);
};

async function loadLoginUserAutoRedirect(delayUtils) {
  const {
    createTag,
    getIconElement,
    placeholders,
  } = delayUtils;
  let followThrough = true;

  const buildRedirectAlert = async (profile) => {
    const container = createTag('div', { class: 'bmtp-container' });
    const headerWrapper = createTag('div', { class: 'bmtp-header' });
    const headerIcon = createTag('div', { class: 'bmtp-header-icon' }, getIconElement('cc-express'));
    const headerText = createTag('span', { class: 'bmtp-header-text' }, placeholders['bmtp-header']);
    const progressBg = createTag('div', { class: 'bmtp-progress-bg' });
    const progressBar = createTag('div', { class: 'bmtp-progress-bar' });
    const profileWrapper = createTag('div', { class: 'profile-wrapper' });
    const profilePhotoCont = createTag('div', { class: 'profile-img-container' });
    const profilePhoto = createTag('img', { src: profile.avatar });
    const profileTextWrapper = createTag('div', { class: 'profile-text-wrapper' });
    const profileName = createTag('strong', { class: 'profile-name' }, profile.display_name);
    const profileEmail = createTag('span', { class: 'profile-email' }, profile.email);
    const noticeWrapper = createTag('div', { class: 'notice-wrapper' });
    const noticeText = createTag('span', { class: 'notice-text' }, placeholders['bmtp-cancel-text']);
    const noticeBtn = createTag('a', { class: 'notice-btn' }, placeholders.cancel);

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

  const profile = window.adobeProfile.getUserProfile();

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

export function loadDelayedLoggedIn(delayUtils, DELAY = 3000) {
  return new Promise((resolve) => {
    loadExpressProduct(delayUtils);
    setTimeout(() => {
      loadLoginUserAutoRedirect(delayUtils);
      resolve();
    }, DELAY);
  });
}

/**
 * Executes everything that happens a lot later, without impacting the user experience.
 */
export default function loadDelayed(delayUtils, DELAY = 3000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      loadExpressProduct(delayUtils);
      resolve();
    }, DELAY);
  });
}
