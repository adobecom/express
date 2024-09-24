import { getMetadata, getIconElement, createTag } from '../../scripts/utils.js';

function createAnimation(src, title, poster) {
  const attribs = {
    class: 'marquee-background',
    playsinline: '',
    autoplay: '',
    muted: '',
    loop: '',
    src,
    title,
    poster,
  };

  // replace anchor with video element
  const video = createTag('video', attribs);
  video.setAttribute('preload', 'auto');
  video.innerHTML = `<source src="${src}" type="video/mp4">`;
  return video;
}

let activeDrawer = null;
function deactivateDrawer() {
  if (!activeDrawer) return;
  activeDrawer.closest('.card').setAttribute('aria-expanded', false);
  activeDrawer.setAttribute('aria-hidden', true);
  activeDrawer = null;
}
function activateDrawer(drawer) {
  deactivateDrawer();
  drawer.closest('.card').setAttribute('aria-expanded', true);
  drawer.setAttribute('aria-hidden', false);
  activeDrawer = drawer;
}
document.addEventListener('click', (e) => {
  if (!activeDrawer) return;
  if (!activeDrawer.contains(e.target)) {
    deactivateDrawer();
  }
});

function createDrawer(card, title, panels) {
  const titleRow = createTag('div', { class: 'title-row' });
  const titleText = title.textContent.trim();
  const drawer = createTag('div', { class: 'drawer', id: `drawer-${titleText}`, 'aria-hidden': true });
  const closeButton = createTag('button', { 'aria-label': 'close' }, getIconElement('close-black'));
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    deactivateDrawer();
  });
  titleRow.append(createTag('strong', { class: 'drawer-title' }, titleText), closeButton);
  drawer.append(titleRow);
  const videoAnchor = card.querySelector('a');
  const videoSrc = videoAnchor.href;
  videoAnchor.remove();
  const posterSrc = card.querySelector('img').src;
  const video = createAnimation(videoSrc, titleText, posterSrc);
  drawer.append(video);

  drawer.append(...panels);
  if (panels.length <= 1) {
    return drawer;
  }

  const tabList = createTag('div', { role: 'tablist' });
  let activeTab = null;
  panels.forEach((panel, i) => {
    panel.role = 'tabpanel';
    const tabHead = panel.querySelector('p:not(:has(a))');
    const tabName = tabHead.textContent;
    const id = `${titleText}-${tabName}`;
    tabHead.remove();
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panel.id = `panel-${id}`;
    i > 0 && (panel.setAttribute('aria-hidden', true));
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
  const card = createTag('button', {
    class: 'card',
    'aria-controls': `drawer-${title.textContent.trim()}`,
    'aria-expanded': false,
  });
  while (item.firstChild) card.append(item.firstChild);
  item.remove();
  const cols = [...card.querySelectorAll(':scope > div')];
  const face = cols[0];
  const drawer = createDrawer(card, title, cols.slice(1));
  face.classList.add('face');
  card.append(drawer);
  card.addEventListener('click', (e) => {
    if (!activeDrawer) {
      e.stopPropagation();
      activateDrawer(drawer);
    }
  });

  return card;
}

export default function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  const headline = rows[0];
  const background = rows[1];
  const items = rows.slice(2, rows.length - 1);
  const ratings = rows[rows.length - 1];
  headline.classList.add('headline');
  background.classList.add('background');
  const backgroundMediaDivs = [...background.querySelectorAll(':scope > div')];
  backgroundMediaDivs.forEach((div, index) => {
    div.classList.add(['mobile-only', 'tablet-only', 'desktop-only'][index]);
  });
  const foreground = createTag('div', { class: 'foreground' });
  const cards = items.map((item) => convertToCard(item));
  const cardsContainer = createTag('div', { class: 'cards-container' });
  cardsContainer.append(...cards);
  foreground.append(headline, cardsContainer);
  if (document.querySelector('main .block') === el && ['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase())) {
    const logo = getIconElement('adobe-express-logo');
    logo.classList.add('express-logo');
    foreground.prepend(logo);
  }
  ratings.classList.add('ratings');
  foreground.append(ratings);
  el.append(foreground);
}
// delay dom for tablet/desktop?
