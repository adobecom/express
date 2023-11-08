import {
  createTag,
  toClassName,
  getLocale,
  addHeaderSizing,
  getIconElement,
  fetchPlaceholders,
} from '../../scripts/utils.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

const breakpointConfig = [
  {
    typeHint: 'default',
    minWidth: 0,
  },
  {
    typeHint: 'mobile',
    minWidth: 0,
  },
  {
    typeHint: 'desktop',
    minWidth: 400,
  },
  {
    typeHint: 'hd',
    minWidth: 1440,
  },
];

// FIXME: Not fulfilling requirement. Re-think of a way to allow subtext to contain link.
function handleSubCTAText(buttonContainer) {
  const elAfterBtn = buttonContainer.nextElementSibling;
  if (!elAfterBtn || elAfterBtn?.tagName !== 'BLOCKQUOTE') return;

  const subText = elAfterBtn.querySelector('p');
  if (subText) {
    subText.classList.add('cta-sub-text');
    buttonContainer.append(subText);
  }
  elAfterBtn.remove();
}

function getBreakpoint(animations) {
  let breakpoint = 'default';
  breakpointConfig.forEach((bp) => {
    if ((window.innerWidth > bp.minWidth) && animations[bp.typeHint]) breakpoint = bp.typeHint;
  });
  return breakpoint;
}

export function handleMediaQuery(block, mediaQuery) {
  localStorage.setItem('reduceMotion', mediaQuery.matches ? 'on' : 'off');

  mediaQuery.addEventListener('change', (e) => {
    const browserValue = localStorage.getItem('reduceMotion') === 'on';
    if (browserValue === e.matches) return;

    if (e.matches) {
      block.classList.add('reduce-motion');
      block.querySelector('video')?.pause();
    } else {
      block.classList.remove('reduce-motion');
      const playPromise = block.querySelector('video')?.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // ignore
        });
      }
    }

    localStorage.setItem('reduceMotion', e.matches ? 'on' : 'off');
  });
}

function decorateToggleContext(ct, placeholders) {
  const reduceMotionIconWrapper = ct;
  const reduceMotionTextExist = reduceMotionIconWrapper.querySelector('.play-animation-text')
    && reduceMotionIconWrapper.querySelector('.pause-animation-text');

  if (!reduceMotionTextExist) {
    const play = createTag('span', { class: 'play-animation-text' });
    const pause = createTag('span', { class: 'pause-animation-text' });
    play.textContent = placeholders ? placeholders['play-animation'] : 'play animation';
    pause.textContent = placeholders ? placeholders['pause-animation'] : 'pause animation';

    reduceMotionIconWrapper.prepend(play, pause);
  }
}

async function buildReduceMotionSwitch(block) {
  if (!block.querySelector('.reduce-motion-wrapper')) {
    const reduceMotionIconWrapper = createTag('div', { class: 'reduce-motion-wrapper' });
    const videoWrapper = block.querySelector('.background-wrapper');
    const video = videoWrapper.querySelector('video');

    if (block.classList.contains('dark')) {
      reduceMotionIconWrapper.append(getIconElement('play-video-light'), getIconElement('pause-video-light'));
    } else {
      reduceMotionIconWrapper.append(getIconElement('play-video'), getIconElement('pause-video'));
    }

    videoWrapper.append(reduceMotionIconWrapper);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    handleMediaQuery(block, mediaQuery);

    const initialValue = localStorage.getItem('reduceMotion') === 'on';

    if (video) {
      if (initialValue) {
        block.classList.add('reduce-motion');
        video.currentTime = Math.floor(video.duration) / 2 || 0;
        video.pause();
      } else {
        video.muted = true;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // ignore
          });
        }
      }
    }

    reduceMotionIconWrapper.addEventListener('click', async () => {
      localStorage.setItem('reduceMotion', localStorage.getItem('reduceMotion') === 'on' ? 'off' : 'on');

      if (localStorage.getItem('reduceMotion') === 'on') {
        block.classList.add('reduce-motion');
        block.querySelector('video')?.pause();
      } else {
        block.classList.remove('reduce-motion');
        const playPromise = block.querySelector('video')?.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // ignore
          });
        }
      }
    }, { passive: true });
    const placeholders = await fetchPlaceholders();
    reduceMotionIconWrapper.addEventListener('mouseenter', (e) => {
      decorateToggleContext(e.currentTarget, placeholders);
    }, { passive: true });
  }
}

function createAnimation(animations) {
  const attribs = {
    class: 'marquee-background',
    playsinline: '',
    autoplay: '',
    muted: '',
  };

  Object.keys(animations).forEach((k) => {
    animations[k].active = false;
  });

  const breakpoint = getBreakpoint(animations);
  const animation = animations[breakpoint];

  if (animation === undefined) return null;

  if (animation.params.loop) {
    attribs.loop = '';
  }
  attribs.poster = animation.poster;
  attribs.title = animation.title;
  const { source } = animation;
  animation.active = true;

  // replace anchor with video element
  const video = createTag('video', attribs);
  if (source) {
    video.innerHTML = `<source src="${source}" type="video/mp4">`;
  }
  return video;
}

function adjustLayout(animations, parent) {
  const breakpoint = getBreakpoint(animations);
  const animation = animations[breakpoint];

  if (animation && !animation.active) {
    const newVideo = createAnimation(animations);
    if (newVideo) {
      parent.replaceChild(newVideo, parent.querySelector('video'));
      newVideo.addEventListener('canplay', () => {
        if (localStorage.getItem('reduceMotion') !== 'on') {
          newVideo.muted = true;
          const playPromise = newVideo.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // ignore
            });
          }
        }
      });
    }
  }
}

export async function transformToVideoLink(cell, a) {
  const { isVideoLink, displayVideoModal } = await import('../shared/video.js');
  a.setAttribute('rel', 'nofollow');
  a.classList.add('video-link');
  const title = a.textContent.trim();

  // gather video urls from all links in cell
  const vidUrls = [];
  [...cell.querySelectorAll(':scope a')]
    .filter((link) => isVideoLink(link.href))
    .forEach((link) => {
      vidUrls.push(link.href);
      if (link !== a) {
        if (link.classList.contains('button')) {
          // remove button with container
          link.closest('.button-container').remove();
        } else {
          // remove link only
          link.remove();
        }
      }
    });
  a.addEventListener('click', (e) => {
    e.preventDefault();
    displayVideoModal(vidUrls, title);
  });

  a.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      displayVideoModal(vidUrls, title);
    }
  });

  // autoplay if hash matches title
  if (toClassName(title) === window.location.hash.substring(1)) {
    displayVideoModal(vidUrls, title);
  }
}

export default async function decorate(block) {
  const possibleBreakpoints = breakpointConfig.map((bp) => bp.typeHint);
  const possibleOptions = ['shadow', 'background'];
  const animations = {};
  const rows = [...block.children];

  for (const div of rows) {
    const index = rows.indexOf(div);
    let rowType = 'animation';
    let typeHint;
    if (index + 1 === rows.length) rowType = 'content';
    if ([...div.children].length > 1) typeHint = div.children[0].textContent.trim().toLowerCase();
    if (typeHint && possibleOptions.includes(typeHint)) {
      rowType = 'option';
    } else if (!typeHint || (typeHint && !possibleBreakpoints.includes(typeHint))) {
      typeHint = 'default';
    }

    if (rowType === 'animation') {
      if (typeHint !== 'default') block.classList.add(`has-${typeHint}-animation`);
      let source;
      let videoParameters = {};
      const a = div.querySelector('a');
      const poster = div.querySelector('img');
      if (a) {
        const url = new URL(a.href);
        const params = new URLSearchParams(url.search);
        videoParameters = {
          loop: params.get('loop') !== 'false',
        };
        const id = url.hostname.includes('hlx.blob.core') ? url.pathname.split('/')[2] : url.pathname.split('media_')[1].split('.')[0];
        source = `./media_${id}.mp4`;
      }
      let optimizedPosterSrc;
      if (poster) {
        const srcURL = new URL(poster.src);
        const srcUSP = new URLSearchParams(srcURL.search);
        srcUSP.set('format', 'webply');
        srcUSP.set('width', typeHint === 'mobile' ? 750 : 4080);
        optimizedPosterSrc = `${srcURL.pathname}?${srcUSP.toString()}`;
      }

      animations[typeHint] = {
        source,
        poster: optimizedPosterSrc || '',
        title: (poster && poster.getAttribute('alt')) || '',
        params: videoParameters,
      };

      div.remove();
    }

    if (rowType === 'content') {
      const videoWrapper = createTag('div', { class: 'background-wrapper' });
      const video = createAnimation(animations);
      let bg;
      if (video) {
        bg = videoWrapper;
        videoWrapper.append(video);
        div.prepend(videoWrapper);
        video.addEventListener('canplay', () => {
          buildReduceMotionSwitch(block);
        });

        window.addEventListener('resize', () => {
          adjustLayout(animations, videoWrapper);
        }, { passive: true });
        adjustLayout(animations, videoWrapper);
      } else {
        bg = createTag('div');
        bg.classList.add('marquee-background');
        div.prepend(bg);
      }

      const marqueeForeground = createTag('div', { class: 'marquee-foreground' });
      bg.nextElementSibling.classList.add('content-wrapper');
      marqueeForeground.append(bg.nextElementSibling);
      div.append(marqueeForeground);

      div.querySelectorAll(':scope p:empty').forEach((p) => {
        if (p.innerHTML.trim() === '') {
          p.remove();
        }
      });

      // check for video link
      // eslint-disable-next-line no-await-in-loop
      const { isVideoLink } = await import('../shared/video.js');
      const videoLink = [...div.querySelectorAll('a')].find((a) => isVideoLink(a.href));
      if (videoLink) {
        transformToVideoLink(div, videoLink);
      }

      const contentButtons = [...div.querySelectorAll('a.button.accent')];
      const primaryBtn = contentButtons[0];
      const secondaryButton = contentButtons[1];
      const buttonAsLink = contentButtons[2];
      buttonAsLink?.classList.remove('button');
      primaryBtn?.classList.add('primaryCTA');
      BlockMediator.set('primaryCtaUrl', primaryBtn?.href);
      secondaryButton?.classList.add('secondary');
      const buttonContainers = [...div.querySelectorAll('p.button-container')];
      const buttonsWrapper = createTag('div', { class: 'buttons-wrapper' });
      buttonContainers[0]?.before(buttonsWrapper);
      buttonContainers.forEach((btnContainer) => {
        handleSubCTAText(btnContainer);
        btnContainer.classList.add('button-inline');
        btnContainer.querySelector('a.button')?.classList.add('xlarge');
        buttonsWrapper.append(btnContainer);
      });
    }

    if (rowType === 'option') {
      if (typeHint === 'shadow') {
        const shadow = (div.querySelector('picture')) ? div.querySelector('picture') : createTag('img', { src: '/express/blocks/marquee/shadow.png' });
        div.innerHTML = '';
        div.appendChild(shadow);
        div.classList.add('hero-shadow');
      }
      if (typeHint === 'background') {
        const color = div.children[1].textContent.trim().toLowerCase();
        if (color) block.style.background = color;
        const lightness = (
          parseInt(color.substring(1, 2), 16)
          + parseInt(color.substring(3, 2), 16)
          + parseInt(color.substring(5, 2), 16)) / 3;
        if (lightness < 200) block.classList.add('white-text');
        div.remove();
      }
    }
  }

  const button = block.querySelector('.button');
  if (button) {
    const { addFreePlanWidget } = await import('../../scripts/utils/free-plan.js');
    await addFreePlanWidget(button.parentElement);
  }

  const phoneNumberTags = block.querySelectorAll('a[title="{{business-sales-numbers}}"]');
  if (phoneNumberTags.length > 0) {
    const { formatSalesPhoneNumber } = await import('../../scripts/utils/pricing.js');
    await formatSalesPhoneNumber(phoneNumberTags);
  }

  if (getLocale(window.location) === 'jp') {
    addHeaderSizing(block);
  }

  block.classList.add('appear');
}
