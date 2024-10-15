import {
  getIconElement,
  createTag,
  fetchPlaceholders,
  getMobileOperatingSystem,
} from '../../scripts/utils.js';

let currDrawer = null;
const desktopMQ = window.matchMedia('(min-width: 1200px)');
const reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

function hideDrawer() {
  if (!currDrawer) return;
  currDrawer.closest('.card').setAttribute('aria-expanded', false);
  currDrawer.setAttribute('aria-hidden', true);
  currDrawer.querySelector('video')?.pause();
  currDrawer = null;
}
function showDrawer(drawer) {
  hideDrawer();
  drawer.closest('.card').setAttribute('aria-expanded', true);
  drawer.setAttribute('aria-hidden', false);
  const video = drawer.querySelector('video');
  if (video && !reduceMotionMQ.matches) {
    video.muted = true;
    video.play()?.catch(); // ignore
  }
  currDrawer = drawer;
}
document.addEventListener('click', (e) => {
  if (!currDrawer) return;
  if (!currDrawer.closest('.card').contains(e.target)) {
    hideDrawer();
  }
});

let isTouch;
function createDrawer(card, titleText, panels) {
  const titleRow = createTag('div', { class: 'title-row' });
  const closeButton = createTag('button', { 'aria-label': 'close' }, getIconElement('close-black'));
  const content = createTag('div', { class: 'content' });
  const drawer = createTag('div', { id: `drawer-${titleText}`, class: 'drawer', 'aria-hidden': true }, content);
  card.append(drawer);
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    hideDrawer();
  });
  titleRow.append(createTag('strong', { class: 'drawer-title' }, titleText), closeButton);
  const videoAnchor = card.querySelector('a');
  videoAnchor.remove();
  const video = createTag('video', {
    playsinline: '',
    muted: '',
    loop: '',
    preload: 'metadata',
    title: titleText,
    poster: card.querySelector('img').src,
  }, `<source src="${videoAnchor.href}" type="video/mp4">`);
  const videoWrapper = createTag('div', { class: 'video-container' }, video);
  content.append(titleRow, videoWrapper, ...panels);

  panels.forEach((panel) => {
    panel.classList.add('ctas-container');
    [...panel.querySelectorAll('p')].forEach((p) => {
      const icon = p.querySelector('span.icon');
      const match = icon && /icon-(.+)/.exec(icon.className);
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
    if (currDrawer) return;
    e.stopPropagation();
    showDrawer(drawer);
  });
  card.addEventListener('touchstart', () => {
    isTouch = true;
  });
  card.addEventListener('mouseenter', () => {
    if (isTouch) return; // touchstart->mouseenter->click
    const firstElem = drawer.querySelector('button, a');
    showDrawer(drawer);
    firstElem?.focus();
  });
  card.addEventListener('focusin', (e) => {
    !card.contains(e.relatedTarget) && showDrawer();
  });
  card.addEventListener('mouseleave', hideDrawer);
  card.addEventListener('focusout', (e) => {
    !card.contains(e.relatedTarget) && hideDrawer();
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
  });

  panels[0].before(tabList);

  return drawer;
}

function convertToCard(item) {
  const title = item.querySelector('strong');
  const titleText = title.textContent.trim();
  const card = createTag('button', {
    class: 'card',
    'aria-controls': `drawer-${titleText}`,
    'aria-expanded': false,
    'aria-label': titleText,
  });
  while (item.firstChild) card.append(item.firstChild);
  item.remove();
  const cols = [...card.querySelectorAll(':scope > div')];

  let created = false;
  window.addEventListener('express:LCP:loaded', () => {
    if (created) return;
    created = true;
    createDrawer(card, title, cols.slice(1));
  });
  cols[0].classList.add('face');
  return card;
}

function decorateHeadline(headline) {
  headline.classList.add('headline');
  const ctas = [...headline.querySelectorAll('a')];
  if (!ctas.length) return headline;
  ctas[0].parentElement.classList.add('ctas-container');
  ctas.forEach((cta) => cta.classList.add('button'));
  ctas[0].classList.add('primaryCTA');
  return headline;
}

async function decorateRatings(el, store) {
  const placeholders = await fetchPlaceholders();
  const ratings = placeholders['app-store-ratings']?.split(';') || [];
  const link = ratings[2]?.trim();
  if (!link) {
    el.remove();
    return;
  }
  const [score, cnt] = ratings[['apple', 'google'].indexOf(store)].split(',').map((str) => str.trim());
  const star = getIconElement('star');
  const storeLink = createTag('a', { href: link }, getIconElement(`${store}-store`));
  const { default: trackBranchParameters } = await import('../../scripts/branchlinks.js');
  await trackBranchParameters([storeLink]);
  el.append(score, star, cnt, storeLink);
}

function createRatings() {
  const ratings = createTag('div', { class: 'ratings' });
  const userAgent = getMobileOperatingSystem();
  if (userAgent !== 'Android') {
    const el = createTag('div', { class: 'container' });
    ratings.append(el);
    decorateRatings(el, 'apple');
  }
  if (userAgent !== 'iOS') {
    const el = createTag('div', { class: 'container' });
    ratings.append(el);
    decorateRatings(el, 'google');
  }
  return ratings;
}

export default function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  const [headline, background, items, foreground] = [decorateHeadline(rows[0]), rows[1], rows.slice(2), createTag('div', { class: 'foreground' })];
  background.classList.add('background');
  const logo = getIconElement('adobe-express-logo');
  logo.classList.add('express-logo');
  const cardsContainer = createTag('div', { class: 'cards-container' }, items.map((item) => convertToCard(item)));
  foreground.append(logo, headline, cardsContainer, ...(el.classList.contains('ratings') ? [createRatings()] : []));
  el.append(foreground);
  desktopMQ.addEventListener('change', () => {
    isTouch = false;
    hideDrawer();
  });
}
