/* eslint-disable no-underscore-dangle */
import { createTag, getIconElement, getMetadata } from '../../scripts/utils.js';
import { trackSearch, updateImpressionCache } from '../../scripts/template-search-api-v3.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

// This file focuses on rendering a single template.

const CONSTANTS = {
  VIDEO_METADATA_TYPE: 'application/vnd.adobe.ccv.videometadata',
  IMAGE_TIMEOUT: 2000,
  TOOLTIP_TIMEOUT: 2500,
};

const getTemplateTitle = (template) => template['dc:title']?.['i-default']
  ?? `${template.moods?.join(', ')} ${template.task?.name}`
  ?? `${getMetadata('topics-x')} ${getMetadata('tasks-x')}`.trim()
  ?? '';

const extractLinkHref = (template, key) => template._links?.[`http://ns.adobe.com/adobecloud/rel/${key}`]?.href;

const getImageThumbnailSrc = (renditionLinkHref, componentLinkHref, page) => {
  const thumbnail = page?.rendition?.image?.thumbnail;
  if (!thumbnail) return renditionLinkHref.replace('{&page,size,type,fragment}', '');

  const {
    mediaType, componentId, width, height, hzRevision,
  } = thumbnail;
  return mediaType === 'image/webp'
    ? componentLinkHref.replace('{&revision,component_id}', `&revision=${hzRevision || 0}&component_id=${componentId}`)
    : renditionLinkHref.replace('{&page,size,type,fragment}', `&size=${Math.max(width, height)}&type=${mediaType}&fragment=id=${componentId}`);
};

const getVideoUrls = async (renditionLinkHref, componentLinkHref, page) => {
  const { componentId } = page.rendition?.video?.thumbnail ?? {};
  const preLink = renditionLinkHref.replace(
    '{&page,size,type,fragment}',
    `&type=${CONSTANTS.VIDEO_METADATA_TYPE}&fragment=id=${componentId}`,
  );
  const backupPosterSrc = getImageThumbnailSrc(renditionLinkHref, componentLinkHref, page);

  try {
    const response = await fetch(preLink);
    if (!response.ok) throw new Error(response.statusText);

    const { renditionsStatus: { state }, posterframe, renditions } = await response.json();
    if (state !== 'COMPLETED') throw new Error('Video not ready');

    const mp4Rendition = renditions.find((r) => r.videoContainer === 'MP4');
    if (!mp4Rendition?.url) throw new Error('No MP4 rendition found');

    return { src: mp4Rendition.url, poster: posterframe?.url ?? backupPosterSrc };
  } catch (err) {
    return {
      src: componentLinkHref.replace('{&revision,component_id}', `&revision=0&component_id=${componentId}`),
      poster: backupPosterSrc,
    };
  }
};

const getPageIterator = (pages) => ({
  i: 0,
  next() { this.i = (this.i + 1) % pages.length; },
  reset() { this.i = 0; },
  current() { return pages[this.i]; },
  all() { return pages; },
});

const renderShareWrapper = (branchUrl, placeholders) => {
  const wrapper = createTag('div', { class: 'share-icon-wrapper' });
  const shareIcon = getIconElement('share-arrow');
  shareIcon.setAttribute('tabindex', '0');
  const tooltip = createTag('div', {
    class: 'shared-tooltip',
    'aria-label': placeholders['tag-copied'] ?? 'Copied to clipboard',
    role: 'tooltip',
    tabindex: '-1',
  });

  let timeoutId = null;
  const share = async () => {
    await navigator.clipboard.writeText(branchUrl);
    tooltip.classList.add('display-tooltip');

    const rect = tooltip.getBoundingClientRect();
    if (rect.left + rect.width > window.innerWidth) {
      tooltip.classList.add('flipped');
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      tooltip.classList.remove('display-tooltip', 'flipped');
    }, CONSTANTS.TOOLTIP_TIMEOUT);
  };

  shareIcon.addEventListener('click', share);
  shareIcon.addEventListener('keypress', (e) => e.key === 'Enter' && share());

  tooltip.append(getIconElement('checkmark-green'));
  tooltip.append(placeholders['tag-copied'] ?? 'Copied to clipboard');
  wrapper.append(shareIcon, tooltip);
  return wrapper;
};

const renderCTA = (placeholders, branchUrl) => {
  const btnTitle = placeholders['edit-this-template'] ?? 'Edit this template';
  return createTag('a', {
    href: branchUrl,
    title: btnTitle,
    class: 'button accent small',
    textContent: btnTitle,
  });
};

const renderRotatingMedias = async (wrapper, pages, { templateTitle, renditionLinkHref, componentLinkHref }) => {
  const pageIterator = getPageIterator(pages);
  let imgTimeoutId;

  const img = createTag('img', { src: '', alt: templateTitle, class: 'hidden' });
  wrapper.prepend(img);

  const video = pages.some((page) => page?.rendition?.video?.thumbnail?.componentId)
    ? createTag('video', {
      muted: true,
      playsinline: '',
      title: templateTitle,
      poster: '',
      class: 'unloaded hidden',
    })
    : null;

  if (video) {
    video.append(createTag('source', { src: '', type: 'video/mp4' }));
    wrapper.prepend(video);
  }

  const playMedia = async () => {
    const currentPage = pageIterator.current();
    if (currentPage.rendition?.video?.thumbnail?.componentId) {
      img.classList.add('hidden');
      if (video) {
        video.classList.remove('hidden');
        const { src, poster } = await getVideoUrls(renditionLinkHref, componentLinkHref, currentPage);
        video.poster = poster;
        video.querySelector('source').src = src;
        video.load();
        video.play().catch(() => {});
      }
    } else {
      if (video) video.classList.add('hidden');
      img.classList.remove('hidden');
      img.src = getImageThumbnailSrc(renditionLinkHref, componentLinkHref, currentPage);
      clearTimeout(imgTimeoutId);
      imgTimeoutId = setTimeout(() => img.dispatchEvent(new CustomEvent('imgended')), CONSTANTS.IMAGE_TIMEOUT);
    }
  };

  const cleanup = () => {
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    clearTimeout(imgTimeoutId);
    pageIterator.reset();
  };

  if (video) {
    video.addEventListener('ended', () => {
      if (pageIterator.all().length > 1) {
        pageIterator.next();
        playMedia();
      }
    });
  }

  img.addEventListener('imgended', () => {
    if (pageIterator.all().length > 1) {
      pageIterator.next();
      playMedia();
    }
  });

  return { cleanup, hover: playMedia };
};

const renderMediaWrapper = (template, placeholders) => {
  const mediaWrapper = createTag('div', { class: 'media-wrapper' });
  let renderedMedia = null;

  const templateInfo = {
    templateTitle: getTemplateTitle(template),
    branchUrl: template.customLinks.branchUrl,
    renditionLinkHref: extractLinkHref(template, 'rendition'),
    componentLinkHref: extractLinkHref(template, 'component'),
  };

  const handleEnter = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!renderedMedia) {
      renderedMedia = await renderRotatingMedias(mediaWrapper, template.pages, templateInfo);
      mediaWrapper.append(renderShareWrapper(templateInfo.branchUrl, placeholders));
    }
    renderedMedia.hover();
    document.querySelector('.singleton-hover')?.classList.remove('singleton-hover');
    e.target.classList.add('singleton-hover');
    document.activeElement.blur();
  };

  return {
    mediaWrapper,
    enterHandler: handleEnter,
    leaveHandler: () => renderedMedia?.cleanup(),
    focusHandler: handleEnter,
  };
};

const renderStillWrapper = (template, placeholders) => {
  const stillWrapper = createTag('div', { class: 'still-wrapper' });
  const imgWrapper = createTag('div', { class: 'image-wrapper' });

  const thumbnailImageHref = getImageThumbnailSrc(
    extractLinkHref(template, 'rendition'),
    extractLinkHref(template, 'component'),
    template.pages[0],
  );

  const img = createTag('img', {
    src: thumbnailImageHref,
    alt: getTemplateTitle(template),
  });

  const planIcon = template.licensingCategory === 'free'
    ? createTag('span', { class: 'free-tag', textContent: placeholders.free || 'Free' })
    : getIconElement('premium');

  let videoIcon = '';
  if (template.pages.length > 1) {
    videoIcon = getIconElement(template.pages.some((p) => p?.rendition?.video?.thumbnail?.componentId) ? 'multipage-video-badge' : 'multipage-static-badge');
  } else if (template.pages[0]?.rendition?.video?.thumbnail?.componentId) {
    videoIcon = getIconElement('video-badge');
  }
  if (videoIcon) videoIcon.classList.add('media-type-icon');

  img.onload = () => {
    imgWrapper.append(planIcon, videoIcon);
  };

  imgWrapper.append(img);
  stillWrapper.append(imgWrapper);
  return stillWrapper;
};

const renderSingleTemplate = (template, placeholders) => {
  if (template.assetType === 'Webpage_Template') {
    template.pages = [{}];
  }

  const tmpltEl = createTag('div');
  tmpltEl.append(renderStillWrapper(template, placeholders));

  const {
    mediaWrapper, enterHandler, leaveHandler, focusHandler,
  } = renderMediaWrapper(template, placeholders);
  const btnContainer = createTag('div', { class: 'button-container' });
  btnContainer.append(mediaWrapper);
  btnContainer.addEventListener('mouseenter', enterHandler);
  btnContainer.addEventListener('mouseleave', leaveHandler);

  const cta = renderCTA(placeholders, template.customLinks.branchUrl);
  btnContainer.prepend(cta);
  cta.addEventListener('focusin', focusHandler);

  cta.addEventListener('click', () => {
    updateImpressionCache({
      content_id: template.id,
      status: template.licensingCategory,
      task: getMetadata('tasksx') || getMetadata('tasks') || '',
      search_keyword: getMetadata('q') || getMetadata('topics') || '',
      collection: getMetadata('tasksx') || getMetadata('tasks') || '',
      collection_path: window.location.pathname,
    });
    trackSearch('select-template', BlockMediator.get('templateSearchSpecs')?.search_id);
  }, { passive: true });

  tmpltEl.append(btnContainer);
  return tmpltEl;
};

export default renderSingleTemplate;
