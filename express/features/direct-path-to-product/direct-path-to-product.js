import {
  createTag,
  fetchPlaceholders,
  getIconElement,
  loadStyle,
} from '../../scripts/utils.js';
import BlockMediator from '../../scripts/block-mediator.js';

const OPT_OUT_KEY = 'no-direct-path-to-product';

export default async function loadLoginUserAutoRedirect() {
  let followThrough = true;
  const placeholders = await fetchPlaceholders();
  loadStyle('/express/features/direct-path-to-product/direct-path-to-product.css');

  const buildRedirectAlert = (profile) => {
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
      localStorage.setItem(OPT_OUT_KEY, '3');
    });

    return container;
  };

  const initRedirect = (container) => {
    container.classList.add('done');

    const primaryCtaUrl = BlockMediator.get('primaryCtaUrl')
      || document.querySelector('a.button.xlarge.same-as-floating-button-CTA, a.primaryCTA')?.href;

    // disable dptp to not annoy user when they come back to AX site.
    localStorage.setItem(OPT_OUT_KEY, '3');

    if (primaryCtaUrl) {
      window.location.assign(primaryCtaUrl);
    } else {
      window.assign('https://new.express.adobe.com');
    }
  };

  const profile = window.adobeProfile.getUserProfile();

  const optOutCounter = localStorage.getItem(OPT_OUT_KEY);

  if (optOutCounter && optOutCounter !== '0') {
    const counterNumber = parseInt(optOutCounter, 10);
    localStorage.setItem(OPT_OUT_KEY, (counterNumber - 1).toString());
  } else {
    const container = buildRedirectAlert(profile);
    setTimeout(() => {
      if (followThrough) initRedirect(container);
    }, 2000);
  }
}
