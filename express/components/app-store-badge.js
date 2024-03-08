import {
  createTag,
  getIconElement,
  getMobileOperatingSystem,
} from '../utils/utils.js';

// eslint-disable-next-line import/prefer-default-export
export function buildAppStoreBadge(href, attrs) {
  const appBadgeWrapper = createTag('div', { class: 'app-store-badge-wrapper' });
  const appBadge = getMobileOperatingSystem() === 'iOS' ? getIconElement('apple-store-borderless') : getIconElement('google-store-borderless');
  const aTag = createTag('a', { href: 'app-store-aTag', class: 'app-store-aTag' });
  const wrapper = createTag('div', { class: 'app-store-wrapper' });

  aTag.href = href;
  appBadgeWrapper.append(appBadge);
  wrapper.append(appBadgeWrapper);
  aTag.append(wrapper);
  for (const [key, value] of Object.entries(attrs)) {
    appBadge.setAttribute(key, value);
  }
  appBadge.classList.add('app-store-badge');
  return aTag;
}
