import {
  getIconElement,
  createTag,
  fetchPlaceholders,
  getMobileOperatingSystem,
} from '../../scripts/utils.js';

let currDrawer = null;
const desktopMQ = window.matchMedia('(min-width: 1200px)');
const reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

function drawerOff() {
  if (!currDrawer) return;
  currDrawer.closest('.card').setAttribute('aria-expanded', false);
  currDrawer.setAttribute('aria-hidden', true);
  currDrawer.querySelector('video')?.pause()?.catch(() => {});
  currDrawer = null;
}
function drawerOn(drawer) {
  drawerOff();
  drawer.closest('.card').setAttribute('aria-expanded', true);
  drawer.setAttribute('aria-hidden', false);
  const video = drawer.querySelector('video');
  if (video && !reduceMotionMQ.matches) {
    video.muted = true;
    video.play().catch(() => {});
  }
  currDrawer = drawer;
}
document.addEventListener('click', (e) => {
  currDrawer && !currDrawer.closest('.card').contains(e.target) && drawerOff();
});
let isTouch;
const iconRegex = /icon-(.+)/;
function makeDrawer(card, videoSrc, titleText, panels) {
  const titleRow = createTag('div', { class: 'title-row' });
  const closeButton = createTag('button', { 'aria-label': 'close' }, getIconElement('close-black'));
  const content = createTag('div', { class: 'content' });
  const drawer = createTag('div', { id: `drawer-${titleText}`, class: 'drawer', 'aria-hidden': true }, content);
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    drawerOff();
  });
  titleRow.append(createTag('strong', { class: 'drawer-title' }, titleText), closeButton);
  const video = createTag('video', {
    playsinline: '',
    muted: '',
    loop: '',
    preload: 'metadata',
    title: titleText,
    poster: card.querySelector('img').src,
  }, `<source src="${videoSrc}" type="video/mp4">`);
  const videoWrapper = createTag('div', { class: 'video-container' }, video);
  content.append(titleRow, videoWrapper, ...panels);

  panels.forEach((panel) => {
    [...panel.querySelectorAll('p')].forEach((p) => {
      const icon = p.querySelector('span.icon');
      const match = icon && iconRegex.exec(icon.className);
      if (match?.[1]) {
        icon.append(getIconElement(match[1]));
      }
      const anchor = p.querySelector('a');
      if (anchor) {
        anchor.prepend(icon);
        p.replaceWith(anchor);
      }
    });
  });
  card.addEventListener('click', (e) => {
    if (currDrawer && e.target !== card && !card.contains(e.target)) return;
    e.stopPropagation();
    drawerOn(drawer);
  });
  card.addEventListener('touchstart', () => {
    isTouch = true;
  });
  card.addEventListener('mouseenter', () => {
    if (isTouch) return; // touchstart->mouseenter->click
    drawerOn(drawer);
  });
  card.addEventListener('mouseleave', () => {
    drawerOff();
  });
  if (panels.length <= 1) {
    return drawer;
  }

  const tabList = createTag('div', { role: 'tablist' });
  let activeTab = null;
  panels.forEach((panel, i) => {
    panel.role = 'tabpanel';
    const tabHead = panel.querySelector('p');
    const tabName = tabHead.textContent;
    const id = `${titleText}-${tabName}`;
    tabHead.remove();
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panel.id = `panel-${id}`;
    panel.setAttribute('aria-hidden', i > 0);
    const tab = createTag('button', {
      role: 'tab',
      'aria-selected': i === 0,
      'aria-controls': `panel-${id}`,
      id: `tab-${id}`,
    }, tabName);
    activeTab ||= tab;
    tab.addEventListener('click', () => {
      activeTab.setAttribute('aria-selected', false);
      tab.setAttribute('aria-selected', true);
      panels.forEach((p) => {
        p.setAttribute('aria-hidden', p !== panel);
      });
      activeTab = tab;
    });
    tabList.append(tab);
    panel.setAttribute('hidden', false);
  });

  panels[0].before(tabList);
  return drawer;
}
function toCard(item) {
  const titleText = item.querySelector('strong').textContent.trim();
  const videoAnchor = item.querySelector('a');
  videoAnchor?.remove();
  const card = createTag('button', {
    class: 'card',
    'aria-controls': `drawer-${titleText}`,
    'aria-expanded': false,
    'aria-label': titleText,
  });
  while (item.firstChild) card.append(item.firstChild);
  item.remove();
  const [face, ...panels] = [...card.querySelectorAll(':scope > div')];
  panels.forEach((panel) => {
    panel.classList.add('panel');
    panel.setAttribute('hidden', true);
  });
  face.classList.add('face');
  new IntersectionObserver((entries, ob) => {
    ob.unobserve(card);
    card.append(makeDrawer(card, videoAnchor.href, titleText, panels));
  }).observe(card);
  return card;
}

function decorateHeadline(headline) {
  headline.classList.add('headline');
  const ctas = [...headline.querySelectorAll('a')];
  if (!ctas.length) return headline;
  ctas[0].parentElement.classList.add('ctas');
  ctas.forEach((cta) => cta.classList.add('button'));
  ctas[0].classList.add('primaryCTA');
  return headline;
}

async function makeRating(store) {
  const placeholders = await fetchPlaceholders();
  const ratings = placeholders['app-store-ratings']?.split(';') || [];
  const link = ratings[2]?.trim();
  if (!link) {
    return null;
  }
  const el = createTag('div', { class: 'container' });
  const [score, cnt] = ratings[['apple', 'google'].indexOf(store)].split(',').map((str) => str.trim());
  const storeLink = createTag('a', { href: link }, getIconElement(`${store}-store`));
  const { default: trackBranchParameters } = await import('../../scripts/branchlinks.js');
  await trackBranchParameters([storeLink]);
  el.append(score, getIconElement('star'), cnt, storeLink);
  return el;
}

function makeRatings() {
  const ratings = createTag('div', { class: 'ratings' });
  const userAgent = getMobileOperatingSystem();
  const cb = (el) => el && ratings.append(el);
  userAgent !== 'Android' && makeRating('apple').then(cb);
  userAgent !== 'iOS' && makeRating('google').then(cb);
  return ratings;
}

export default function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  const [headline, background, items, foreground] = [decorateHeadline(rows[0]), rows[1], rows.slice(2), createTag('div', { class: 'foreground' })];
  background.classList.add('background');
  const logo = getIconElement('adobe-express-logo');
  logo.classList.add('express-logo');
  const cardsContainer = createTag('div', { class: 'cards-container' }, items.map((item) => toCard(item)));
  foreground.append(logo, headline, cardsContainer, ...(el.classList.contains('ratings') ? [makeRatings()] : []));
  el.append(foreground);
  desktopMQ.addEventListener('change', () => {
    isTouch = false;
    drawerOff();
  });
}
