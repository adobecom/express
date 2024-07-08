import { createTag } from '../../scripts/utils.js';
import { isVideoLink } from '../shared/video.js';

function renderImageOrVideo(media) {
  let updatedMedia;
  if (media.tagName.toUpperCase() === 'PICTURE') {
    updatedMedia = media.querySelector('img');
  } else if (!media?.href) {
    return null;
  } else if (isVideoLink(media?.href)) {
    const attributes = { class: 'hero-animation-background' };
    ['playsinline', 'autoplay', 'loop', 'muted'].forEach((p) => {
      attributes[p] = '';
    });
    updatedMedia = createTag('video', attributes);
    updatedMedia.src = media.href;
  }
  return updatedMedia;
}

function renderGridNode({
  media,
  title,
  subText,
  cta,
}, index, color) {
  const gridItem = createTag('a', { class: `grid-item item-${index + 1}` });
  const updatedMedia = renderImageOrVideo(media);
  gridItem.href = cta?.href;
  if (color) {
    console.log('------');
    console.log(color);
    gridItem.style = `background-image:${color}`;
  }
  if (title) gridItem.append(title);
  if (subText) gridItem.append(subText);
  if (cta) {
    cta.classList.add('cta');
    cta.classList.remove('button');
    gridItem.append(cta);
  }

  if (index < 4) {
    gridItem.append(updatedMedia);
  } else {
    gridItem.prepend(updatedMedia);
  }
  return gridItem;
}

const blockProperties = ['button-text', 'card-image', 'button-image', 'button-color', 'card-color'];

const extractProperties = (block) => {
  const rows = Array.from(block.querySelectorAll(':scope > div'));

  const allProperties = {};

  rows.forEach((row) => {
    if (row?.children?.length !== 2) {
      return;
    }
    const key = row?.children[0].textContent;
    const value = row?.children[1].textContent;
    if (key && value && blockProperties.includes(key?.toLowerCase())) {
      allProperties[key.toLowerCase()] = value;
      block.removeChild(row);
    }
  });
  return allProperties;
};

const decorateLoadMoreSection = (block, text, color) => {
  const loadMoreWrapper = createTag('div', { class: 'load-more-div' });
  const loadMoreButton = createTag('button', { class: 'load-more-button' });
  const loadMoreText = createTag('span', { class: 'load-more-text' });
  const toggleChev = createTag('div', { class: 'load-more-chev' });

  loadMoreButton.append('Load More', toggleChev);
  loadMoreWrapper.append(loadMoreButton);
  block.append(loadMoreWrapper);
  loadMoreButton.addEventListener('click', () => {
    block.classList.toggle('expanded');
    if (block.classList.contains('expanded')) {
      [, loadMoreText.textContent] = text || 'Load More';
    } else {
      [loadMoreText.textContent] = text || 'Load More';
    }
  });
  console.log(text, color);
  if (color) {
    loadMoreButton.style = `background-image:${color}`;
  }
};

export default function decorate(block) {
  const properties = extractProperties(block);

  const inputRows = block.querySelectorAll(':scope > div > div');

  block.innerHTML = '';
  const rows = Array.from(inputRows);
  const heading = rows.shift();

  const gridProps = rows.map((row) => {
    const subText = row.querySelector('p');
    const media = row.querySelector('p:last-of-type > a, p:last-of-type > picture');
    const title = row.querySelector('h2');
    const cta = row.querySelector('a');
    return {
      media,
      title,
      subText,
      cta,
    };
  });
  const gridContainer = createTag('div', { class: 'grid-container' });
  const gridItems = gridProps.map((props, index) => renderGridNode(props, index, properties['card-image'] || properties['card-color']));
  heading.classList.add('heading');

  gridItems.forEach((gridItem) => {
    gridContainer.append(gridItem);
  });

  block.append(heading, gridContainer);
  if (rows.length > 4) {
    decorateLoadMoreSection(block, properties['button-text'], properties['button-image'] || properties['button-color']);
  }
}
