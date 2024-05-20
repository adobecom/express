const AUTO_BLOCKS = [
  { faas: '/tools/faas' },
  { fragment: '/express/fragments/' },
];

const DO_NOT_INLINE = [
  'accordion',
  'columns',
  'z-pattern',
];

const ENVS = {
  stage: {
    name: 'stage',
    ims: 'stg1',
    adobeIO: 'cc-collab-stage.adobe.io',
    adminconsole: 'stage.adminconsole.adobe.com',
    account: 'stage.account.adobe.com',
    edgeConfigId: '8d2805dd-85bf-4748-82eb-f99fdad117a6',
    pdfViewerClientId: '600a4521c23d4c7eb9c7b039bee534a0',
  },
  prod: {
    name: 'prod',
    ims: 'prod',
    adobeIO: 'cc-collab.adobe.io',
    adminconsole: 'adminconsole.adobe.com',
    account: 'account.adobe.com',
    edgeConfigId: '2cba807b-7430-41ae-9aac-db2b0da742d5',
    pdfViewerClientId: '3c0a5ddf2cc04d3198d9e48efc390fa9',
  },
};
ENVS.local = {
  ...ENVS.stage,
  name: 'local',
};

const LANGSTORE = 'langstore';

const PAGE_URL = new URL(window.location.href);

export function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const $meta = document.head.querySelector(`meta[${attr}="${name}"]`);
  return ($meta && $meta.content) || '';
}

function getEnv(conf) {
  const { host } = window.location;
  const query = PAGE_URL.searchParams.get('env');

  if (query) return { ...ENVS[query], consumer: conf[query] };
  if (host.includes('localhost')) return { ...ENVS.local, consumer: conf.local };
  /* c8 ignore start */
  if (host.includes('hlx.page')
    || host.includes('hlx.live')
    || host.includes('stage.adobe')
    || host.includes('corp.adobe')) {
    return { ...ENVS.stage, consumer: conf.stage };
  }
  return { ...ENVS.prod, consumer: conf.prod };
  /* c8 ignore stop */
}

export function getLocale(locales, pathname = window.location.pathname) {
  if (!locales) {
    return { ietf: 'en-US', tk: 'hah7vzn.css', prefix: '' };
  }
  const split = pathname.split('/');
  const localeString = split[1];
  const locale = locales[localeString] || locales[''];
  if (localeString === LANGSTORE) {
    locale.prefix = `/${localeString}/${split[2]}`;
    if (
      Object.values(locales)
        .find((loc) => loc.ietf?.startsWith(split[2]))?.dir === 'rtl'
    ) locale.dir = 'rtl';
    return locale;
  }
  const isUS = locale.ietf === 'en-US';
  locale.prefix = isUS ? '' : `/${localeString}`;
  locale.region = isUS ? 'us' : localeString.split('_')[0];
  return locale;
}

export const [setConfig, updateConfig, getConfig] = (() => {
  let config = {};
  return [
    (conf) => {
      const origin = conf.origin || window.location.origin;
      const pathname = conf.pathname || window.location.pathname;
      config = { env: getEnv(conf), ...conf };
      config.codeRoot = conf.codeRoot ? `${origin}${conf.codeRoot}` : origin;
      config.base = config.miloLibs || config.codeRoot;
      config.locale = pathname ? getLocale(conf.locales, pathname) : getLocale(conf.locales);
      config.autoBlocks = conf.autoBlocks ? [...AUTO_BLOCKS, ...conf.autoBlocks] : AUTO_BLOCKS;
      config.doNotInline = conf.doNotInline
        ? [...DO_NOT_INLINE, ...conf.doNotInline]
        : DO_NOT_INLINE;
      const lang = getMetadata('content-language') || config.locale.ietf;
      document.documentElement.setAttribute('lang', lang);
      try {
        const dir = getMetadata('content-direction')
          || config.locale.dir
          || (config.locale.ietf && (new Intl.Locale(config.locale.ietf)?.textInfo?.direction))
          || 'ltr';
        document.documentElement.setAttribute('dir', dir);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('Invalid or missing locale:', e);
      }
      config.locale.contentRoot = `${origin}${config.locale.prefix}${config.contentRoot ?? ''}`;
      config.useDotHtml = !PAGE_URL.origin.includes('.hlx.')
        && (conf.useDotHtml ?? PAGE_URL.pathname.endsWith('.html'));
      return config;
    },
    // eslint-disable-next-line no-return-assign
    (conf) => (config = conf),
    () => config,
  ];
})();

/**
 * log RUM if part of the sample.
 * @param {string} checkpoint identifies the checkpoint in funnel
 * @param {Object} data additional data for RUM sample
 * @param {Number} forceSampleRate force weight on specific RUM sampling
 */

export function sampleRUM(checkpoint, data = {}, forceSampleRate) {
  sampleRUM.defer = sampleRUM.defer || [];
  const defer = (fnname) => {
    sampleRUM[fnname] = sampleRUM[fnname]
      || ((...args) => sampleRUM.defer.push({ fnname, args }));
  };
  sampleRUM.drain = sampleRUM.drain
    || ((dfnname, fn) => {
      sampleRUM[dfnname] = fn;
      sampleRUM.defer
        .filter(({ fnname }) => dfnname === fnname)
        .forEach(({ fnname, args }) => sampleRUM[fnname](...args));
    });
  sampleRUM.on = (chkpnt, fn) => {
    sampleRUM.cases[chkpnt] = fn;
  };
  defer('observe');
  defer('cwv');
  defer('stash');
  try {
    window.hlx = window.hlx || {};
    if (!window.hlx.rum) {
      const usp = new URLSearchParams(window.location.search);
      const weight = (usp.get('rum') === 'on') ? 1 : forceSampleRate || window.RUM_LOW_SAMPLE_RATE;
      // eslint-disable-next-line no-bitwise
      const hashCode = (s) => s.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0);
      const id = `${hashCode(window.location.href)}-${new Date().getTime()}-${Math.random().toString(16).substr(2, 14)}`;
      const random = Math.random();
      const isSelected = (random * weight < 1);
      // eslint-disable-next-line object-curly-newline
      window.hlx.rum = { weight, id, random, isSelected, sampleRUM };
    }
    const { id } = window.hlx.rum;
    if ((window.hlx && window.hlx.rum && window.hlx.rum.isSelected) || checkpoint === 'experiment') {
      const sendPing = (pdata = data) => {
        if (!window.hlx.rum.isSelected) {
          return;
        }
        // eslint-disable-next-line object-curly-newline, max-len, no-use-before-define
        const body = JSON.stringify({ weight: window.hlx.rum.weight, id, referer: window.location.href, generation: window.RUM_GENERATION, checkpoint, ...data });
        const url = `https://rum.hlx.page/.rum/${window.hlx.rum.weight}`;
        // eslint-disable-next-line no-unused-expressions
        navigator.sendBeacon(url, body);
        // eslint-disable-next-line no-console
        console.debug(`ping:${checkpoint}:${window.hlx.rum.weight}`, pdata);
      };
      sampleRUM.cases = sampleRUM.cases || {
        cwv: () => sampleRUM.cwv(data) || true,
        lazy: () => {
          // use classic script to avoid CORS issues
          const script = document.createElement('script');
          script.src = 'https://rum.hlx.page/.rum/@adobe/helix-rum-enhancer@^1/src/index.js';
          document.head.appendChild(script);
          sendPing(data);
          return true;
        },
        experiment: () => {
          // track experiments with higher sampling rate
          window.hlx.rum.weight = Math.min(window.hlx.rum.weight, window.RUM_HIGH_SAMPLE_RATE);
          window.hlx.rum.isSelected = (window.hlx.rum.random * window.hlx.rum.weight < 1);

          sampleRUM.drain('stash', sampleRUM);
          sendPing(data);
          return true;
        },
      };
      sendPing(data);
      if (sampleRUM.cases[checkpoint]) {
        sampleRUM.cases[checkpoint]();
      }
    } else {
      sampleRUM.stash(checkpoint, data); // save the event for later
    }
  } catch (error) {
    // something went wrong
  }
}

export function getAssetDetails(el) {
  if (el.tagName === 'PICTURE') {
    return getAssetDetails(el.querySelector('img'));
  }
  // Get asset details
  const assetUrl = new URL(
    el.href // the reference for an a/svg tag
    || el.currentSrc // the active source in a picture/video/audio element
    || el.src,
  ); // the source for an image/video/iframe
  const match = assetUrl.href.match(/media_([a-f0-9]+)\.\w+/);
  let assetId;
  if (match) {
    [, assetId] = match;
  } else if (assetUrl.origin.endsWith('.adobeprojectm.com')) {
    [assetId] = assetUrl.pathname.split('/').splice(-2, 1);
  } else {
    assetId = `${assetUrl.pathname}`;
  }
  return {
    assetId,
    assetPath: assetUrl.href,
  };
}

/**
 * Track assets in that appear in the viewport and add populate
 * `viewasset` events to the data layer.
 */
function trackViewedAssetsInDataLayer(assetsSelectors = ['img[src*="/media_"]']) {
  const assetsSelector = assetsSelectors.join(',');

  const viewAssetObserver = new IntersectionObserver((entries) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .forEach((entry) => {
        const el = entry.target;

        // observe only once
        viewAssetObserver.unobserve(el);

        // Get asset details
        const { assetId, assetPath } = getAssetDetails(el);
        const details = {
          event: 'viewasset',
          assetId,
          assetPath,
        };

        // Add experiment details
        const { id, selectedVariant } = (window.hlx.experiment || {});
        if (selectedVariant) {
          details.experiment = id;
          details.variant = selectedVariant;
        }

        window.dataLayer.push(details);
      });
  }, { threshold: 0.25 });

  // Observe all assets in the DOM
  document.querySelectorAll(assetsSelector).forEach((el) => {
    viewAssetObserver.observe(el);
  });

  // Observe all assets added async
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          return;
        }
        n.querySelectorAll(assetsSelector).forEach((asset) => {
          viewAssetObserver.unobserve(asset);
        });
      });
      mutation.addedNodes.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          return;
        }
        n.querySelectorAll(assetsSelector).forEach((asset) => {
          viewAssetObserver.observe(asset);
        });
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
}

export function addPublishDependencies(url) {
  if (!Array.isArray(url)) {
    // eslint-disable-next-line no-param-reassign
    url = [url];
  }
  window.hlx = window.hlx || {};
  if (window.hlx.dependencies && Array.isArray(window.hlx.dependencies)) {
    window.hlx.dependencies.concat(url);
  } else {
    window.hlx.dependencies = url;
  }
}

export function toClassName(name) {
  return name && typeof name === 'string'
    ? name.trim().toLowerCase().replace(/[^0-9a-z]/gi, '-')
    : '';
}

export function createTag(tag, attributes, html) {
  const el = document.createElement(tag);
  if (html) {
    if (html instanceof HTMLElement
      || html instanceof SVGElement
      || html instanceof DocumentFragment) {
      el.append(html);
    } else if (Array.isArray(html)) {
      el.append(...html);
    } else {
      el.insertAdjacentHTML('beforeend', html);
    }
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      el.setAttribute(key, val);
    });
  }
  return el;
}

// Get lottie animation HTML - remember to lazyLoadLottiePlayer() to see it.
// Get lottie animation HTML - remember to lazyLoadLottiePlayer() to see it.
export function getLottie(name, src, loop = true, autoplay = true, control = false, hover = false) {
  return createTag('lottie-player', {
    class: `lottie lottie-${name}`,
    src,
    background: 'transparent',
    speed: 1,
    loop: loop ? 'loop' : '',
    autoplay: autoplay ? 'autoplay' : '',
    control: control ? 'controls' : '',
    hover: hover ? 'hover' : '',
  });
}
// Lazy-load lottie player if you scroll to the block.
export function lazyLoadLottiePlayer($block = null) {
  const usp = new URLSearchParams(window.location.search);
  const lottie = usp.get('lottie');
  if (lottie !== 'off') {
    const loadLottiePlayer = () => {
      if (window['lottie-player']) return;
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = '/express/scripts/lottie-player.1.5.6.js';
      document.head.appendChild(script);
      window['lottie-player'] = true;
    };
    if ($block) {
      const addIntersectionObserver = (block) => {
        const observer = (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting) {
            if (entry.intersectionRatio >= 0.25) {
              loadLottiePlayer();
            }
          }
        };
        const options = {
          root: null,
          rootMargin: '0px',
          threshold: [0.0, 0.25],
        };
        const intersectionObserver = new IntersectionObserver(observer, options);
        intersectionObserver.observe(block);
      };
      if (document.readyState === 'complete') {
        addIntersectionObserver($block);
      } else {
        window.addEventListener('load', () => {
          addIntersectionObserver($block);
        });
      }
    } else if (document.readyState === 'complete') {
      loadLottiePlayer();
    } else {
      window.addEventListener('load', () => {
        loadLottiePlayer();
      });
    }
  }
}

export function getIcon(icons, alt, size = 44) {
  // eslint-disable-next-line no-param-reassign
  icons = Array.isArray(icons) ? icons : [icons];
  const [defaultIcon, mobileIcon] = icons;
  const icon = (mobileIcon && window.innerWidth < 600) ? mobileIcon : defaultIcon;
  const symbols = [
    'adobefonts',
    'adobe-stock',
    'android',
    'animation',
    'blank',
    'brand',
    'brand-libraries',
    'brandswitch',
    'calendar',
    'certified',
    'color-how-to-icon',
    'changespeed',
    'check',
    'chevron',
    'cloud-storage',
    'crop-image',
    'crop-video',
    'convert',
    'convert-png-jpg',
    'cursor-browser',
    'desktop',
    'desktop-round',
    'download',
    'elements',
    'facebook',
    'globe',
    'incredibly-easy',
    'instagram',
    'image',
    'ios',
    'libraries',
    'library',
    'linkedin',
    'magicwand',
    'mergevideo',
    'mobile-round',
    'muteaudio',
    'palette',
    'photos',
    'photoeffects',
    'pinterest',
    'play',
    'premium-templates',
    'pricingfree',
    'pricingpremium',
    'privacy',
    'qr-code',
    'remove-background',
    'resize',
    'resize-video',
    'reversevideo',
    'rush',
    'snapchat',
    'sparkpage',
    'sparkvideo',
    'stickers',
    'templates',
    'text',
    'tiktok',
    'trim-video',
    'twitter',
    'up-download',
    'upload',
    'users',
    'webmobile',
    'youtube',
    'star',
    'star-half',
    'star-empty',
    'pricing-gen-ai',
    'pricing-features',
    'pricing-import',
    'pricing-motion',
    'pricing-stock',
    'pricing-one-click',
    'pricing-collaborate',
    'pricing-premium-plan',
    'pricing-sync',
    'pricing-brand',
    'pricing-calendar',
    'pricing-fonts',
    'pricing-libraries',
    'pricing-cloud',
    'pricing-support',
    'pricing-sharing',
    'pricing-history',
    'pricing-corporate',
    'pricing-admin',
  ];

  const size22Icons = [
    'chevron',
    'pricingfree',
    'pricingpremium',
  ];

  if (symbols.includes(icon)) {
    const iconName = icon;
    let sheetSize = size;
    if (size22Icons.includes(icon)) sheetSize = 22;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-${icon}">
      ${alt ? `<title>${alt}</title>` : ''}
      <use href="/express/icons/ccx-sheet_${sheetSize}.svg#${iconName}${sheetSize}"></use>
    </svg>`;
  } else {
    return (`<img class="icon icon-${icon}" src="/express/icons/${icon}.svg" alt="${alt || icon}">`);
  }
}

export function getIconElement(icons, size, alt, additionalClassName) {
  const $div = createTag('div');
  $div.innerHTML = getIcon(icons, alt, size);

  if (additionalClassName) $div.firstElementChild.classList.add(additionalClassName);
  return ($div.firstElementChild);
}

export function transformLinkToAnimation($a, $videoLooping = true) {
  if (!$a || !$a.href.endsWith('.mp4')) {
    return null;
  }
  const params = new URL($a.href).searchParams;
  const attribs = {};
  const dataAttr = $videoLooping ? ['playsinline', 'autoplay', 'loop', 'muted'] : ['playsinline', 'autoplay', 'muted'];
  dataAttr.forEach((p) => {
    if (params.get(p) !== 'false') attribs[p] = '';
  });
  // use closest picture as poster
  const $poster = $a.closest('div').querySelector('picture source');
  if ($poster) {
    attribs.poster = $poster.srcset;
    $poster.parentNode.remove();
  }
  // replace anchor with video element
  const videoUrl = new URL($a.href);

  const isLegacy = videoUrl.hostname.includes('hlx.blob.core') || videoUrl.pathname.includes('media_');
  const $video = createTag('video', attribs);
  if (isLegacy) {
    const helixId = videoUrl.hostname.includes('hlx.blob.core') ? videoUrl.pathname.split('/')[2] : videoUrl.pathname.split('media_')[1].split('.')[0];
    const videoHref = `./media_${helixId}.mp4`;
    $video.innerHTML = `<source src="${videoHref}" type="video/mp4">`;
  } else {
    $video.innerHTML = `<source src="${videoUrl}" type="video/mp4">`;
  }

  const $innerDiv = $a.closest('div');
  $innerDiv.prepend($video);
  $innerDiv.classList.add('hero-animation-overlay');
  $video.setAttribute('tabindex', 0);
  $a.replaceWith($video);
  // autoplay animation
  $video.addEventListener('canplay', () => {
    $video.muted = true;
    const playPromise = $video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // ignore
      });
    }
  });
  return $video;
}

export function linkPicture($picture) {
  const $nextSib = $picture.parentNode.nextElementSibling;
  if ($nextSib) {
    const $a = $nextSib.querySelector('a');
    if ($a && $a.textContent.trim().startsWith('https://')) {
      $a.innerHTML = '';
      $a.className = '';
      $a.appendChild($picture);
    }
  }
}

export function linkImage($elem) {
  const $a = $elem.querySelector('a');
  if ($a) {
    const $parent = $a.closest('div');
    $a.remove();
    $a.className = '';
    $a.innerHTML = '';
    $a.append(...$parent.children);
    $parent.append($a);
  }
}

export function readBlockConfig($block) {
  const config = {};
  $block.querySelectorAll(':scope>div').forEach(($row) => {
    if ($row.children) {
      const $cols = [...$row.children];
      if ($cols[1]) {
        const $value = $cols[1];
        const name = toClassName($cols[0].textContent.trim());
        let value;
        if ($value.querySelector('a')) {
          const $as = [...$value.querySelectorAll('a')];
          if ($as.length === 1) {
            value = $as[0].href;
          } else {
            value = $as.map(($a) => $a.href);
          }
        } else if ($value.querySelector('p')) {
          const $ps = [...$value.querySelectorAll('p')];
          if ($ps.length === 1) {
            value = $ps[0].textContent.trim();
          } else {
            value = $ps.map(($p) => $p.textContent.trim());
          }
        } else value = $row.children[1].textContent.trim();
        config[name] = value;
      }
    }
  });
  return config;
}

export function yieldToMain() {
  return new Promise((r) => {
    setTimeout(r, 0);
  });
}

export function removeIrrelevantSections(main) {
  if (!main) return;
  main.querySelectorAll(':scope > div').forEach((section) => {
    const sectionMetaBlock = section.querySelector('div.section-metadata');
    if (sectionMetaBlock) {
      const sectionMeta = readBlockConfig(sectionMetaBlock);

      // section meant for different device
      let sectionRemove = !!(sectionMeta.audience
        && sectionMeta.audience.toLowerCase() !== document.body.dataset?.device);

      // section visibility steered over metadata
      if (!sectionRemove && sectionMeta.showwith !== undefined) {
        let showWithSearchParam = null;
        if (!['www.adobe.com'].includes(window.location.hostname)) {
          const urlParams = new URLSearchParams(window.location.search);
          showWithSearchParam = urlParams.get(`${sectionMeta.showwith.toLowerCase()}`)
            || urlParams.get(`${sectionMeta.showwith}`);
        }
        sectionRemove = showWithSearchParam !== null ? showWithSearchParam !== 'on' : getMetadata(sectionMeta.showwith.toLowerCase()) !== 'on';
      }
      if (sectionRemove) section.remove();
    }
  });

  // floating CTA vs page CTA with same text or link logics
  if (['yes', 'y', 'true', 'on'].includes(getMetadata('show-floating-cta')?.toLowerCase())) {
    const { device } = document.body.dataset;
    const textToTarget = getMetadata(`${device}-floating-cta-text`)?.trim() || getMetadata('main-cta-text')?.trim();
    const linkToTarget = getMetadata(`${device}-floating-cta-link`)?.trim() || getMetadata('main-cta-link')?.trim();
    if (textToTarget || linkToTarget) {
      const linkToTargetURL = new URL(linkToTarget);
      const sameUrlCTAs = Array.from(main.querySelectorAll('a:any-link'))
        .filter((a) => {
          try {
            const currURL = new URL(a.href);
            const sameText = a.textContent.trim() === textToTarget;
            const samePathname = currURL.pathname === linkToTargetURL?.pathname;
            const sameHash = currURL.hash === linkToTargetURL?.hash;
            const isNotInFloatingCta = !a.closest('.block')?.classList.contains('floating-button');
            const notFloatingCtaIgnore = !a.classList.contains('floating-cta-ignore');

            return (sameText || (samePathname && sameHash))
              && isNotInFloatingCta && notFloatingCtaIgnore;
          } catch (err) {
            window.lana?.log(err);
            return false;
          }
        });

      sameUrlCTAs.forEach((cta) => {
        cta.classList.add('same-as-floating-button-CTA');
      });
    }
  }
}

/**
 * Decorates a block.
 * @param {Element} block The block element
 */
export async function decorateBlock(block) {
  const blockName = block.classList[0];
  if (blockName) {
    const section = block.closest('.section');
    if (section) section.classList.add(`${[...block.classList].join('-')}-container`);

    const showWith = [...block.classList].filter((c) => c.toLowerCase().startsWith('showwith'));
    // block visibility steered over metadata
    if (showWith.length) {
      let blockRemove = true;
      if (!['www.adobe.com'].includes(window.location.hostname)) {
        let showWithSearchParam = null;
        showWith.forEach((showWithClass) => {
          if (!blockRemove) return;
          const featureFlag = showWithClass.replace('showwith', '');
          const caseInsensitiveParams = {};
          for (const [name, value] of new URLSearchParams(window.location.search)) {
            caseInsensitiveParams[name.toLowerCase()] = value.toLowerCase();
          }
          showWithSearchParam = caseInsensitiveParams[featureFlag];
          blockRemove = showWithSearchParam ? showWithSearchParam !== 'on' : getMetadata(featureFlag.toLowerCase()) !== 'on';
        });
      }
      if (blockRemove) {
        block.remove();
        return;
      }
    }

    // begin CCX custom block option class handling
    // split and add options with a dash
    // (fullscreen-center -> fullscreen-center + fullscreen + center)
    const extra = [];
    block.classList.forEach((className, index) => {
      if (index === 0) return; // block name, no split
      const split = className.split('-');
      if (split.length > 1) {
        split.forEach((part) => {
          extra.push(part);
        });
      }
    });
    block.classList.add(...extra);
    // end CCX custom block option class handling

    block.classList.add('block');

    block.dataset.block = '';
    block.setAttribute('data-block-name', blockName);
    block.setAttribute('data-block-status', 'initialized');

    if (getMetadata('sheet-powered') === 'Y') {
      const { setBlockTheme } = await import('./content-replace.js');
      setBlockTheme(block);
    }
  }
}

export function decorateSVG(a) {
  const { textContent, href } = a;
  if (!(textContent.includes('.svg') || href.includes('.svg'))) return a;
  try {
    // Mine for URL and alt text
    const splitText = textContent.split('|');
    const textUrl = new URL(splitText.shift().trim());
    const altText = splitText.join('|').trim();

    // Relative link checking
    const hrefUrl = a.href.startsWith('/')
      ? new URL(`${window.location.origin}${a.href}`)
      : new URL(a.href);

    const src = textUrl.hostname.includes('.hlx.') ? textUrl.pathname : textUrl;

    const img = createTag('img', { loading: 'lazy', src });
    if (altText) img.alt = altText;
    const pic = createTag('picture', null, img);

    if (textUrl.pathname === hrefUrl.pathname) {
      a.parentElement.replaceChild(pic, a);
      return pic;
    }
    a.textContent = '';
    a.append(pic);
    return a;
  } catch (e) {
    window.lana.log(`Failed to create SVG: ${e.message}`);
    return a;
  }
}

function getExtension(path) {
  const pageName = path.split('/').pop();
  return pageName.includes('.') ? pageName.split('.').pop() : '';
}

export function localizeLink(
  href,
  originHostName = window.location.hostname,
  overrideDomain = false,
) {
  try {
    const url = new URL(href);
    const relative = url.hostname === originHostName;
    const processedHref = relative ? href.replace(url.origin, '') : href;
    const { hash } = url;
    // TODO remove this special logic for uk & in after coordinating with Pankaj & Mili
    if (hash.includes('#_dnt') || window.location.href.includes('/uk/express/learn/blog') || window.location.href.includes('/in/express/learn/blog')) return processedHref.replace('#_dnt', '');
    const path = url.pathname;
    const extension = getExtension(path);
    const allowedExts = ['', 'html', 'json'];
    if (!allowedExts.includes(extension)) return processedHref;
    const { locale, locales, prodDomains } = getConfig();
    if (!locale || !locales) return processedHref;
    const isLocalizable = relative || (prodDomains && prodDomains.includes(url.hostname))
      || overrideDomain;
    if (!isLocalizable) return processedHref;
    const isLocalizedLink = path.startsWith(`/${LANGSTORE}`) || Object.keys(locales)
      .some((loc) => loc !== '' && (path.startsWith(`/${loc}/`) || path.endsWith(`/${loc}`)));
    if (isLocalizedLink) return processedHref;
    const urlPath = `${locale.prefix}${path}${url.search}${hash}`;
    return relative ? urlPath : `${url.origin}${urlPath}`;
  } catch (error) {
    return href;
  }
}

function appendHtmlToLink(link) {
  const { useDotHtml } = getConfig();
  if (!useDotHtml) return;
  const href = link.getAttribute('href');
  if (!href?.length) return;

  const { autoBlocks = [], htmlExclude = [] } = getConfig();

  const HAS_EXTENSION = /\..*$/;
  let url = { pathname: href };

  try {
    url = new URL(href, PAGE_URL);
  } catch (e) {
    /* do nothing */
  }

  if (!(href.startsWith('/') || href.startsWith(PAGE_URL.origin))
    || url.pathname?.endsWith('/')
    || href === PAGE_URL.origin
    || HAS_EXTENSION.test(href.split('/').pop())
    || htmlExclude?.some((excludeRe) => excludeRe.test(href))) {
    return;
  }

  const relativeAutoBlocks = autoBlocks
    .map((b) => Object.values(b)[0])
    .filter((b) => b.startsWith('/'));
  const isAutoblockLink = relativeAutoBlocks.some((block) => href.includes(block));
  if (isAutoblockLink) return;

  try {
    const linkUrl = new URL(href.startsWith('http') ? href : `${PAGE_URL.origin}${href}`);
    if (linkUrl.pathname && !linkUrl.pathname.endsWith('.html')) {
      linkUrl.pathname = `${linkUrl.pathname}.html`;
      link.setAttribute('href', href.startsWith('/')
        ? `${linkUrl.pathname}${linkUrl.search}${linkUrl.hash}`
        : linkUrl.href);
    }
  } catch (e) {
    window.lana?.log(`Error while attempting to append '.html' to ${link}: ${e}`);
  }
}

function decorateImageLinks(el) {
  const images = el.querySelectorAll('img[alt*="|"]');
  if (!images.length) return;
  [...images].forEach((img) => {
    const [source, alt, icon] = img.alt.split('|');
    try {
      const url = new URL(source.trim());
      const href = url.hostname.includes('.hlx.') ? `${url.pathname}${url.hash}` : url.href;
      if (alt?.trim().length) img.alt = alt.trim();
      const pic = img.closest('picture');
      const picParent = pic.parentElement;
      const aTag = createTag('a', { href, class: 'image-link' });
      picParent.insertBefore(aTag, pic);
      if (icon) {
        import('./image-video-link.js').then((mod) => mod.default(picParent, aTag, icon));
      } else {
        aTag.append(pic);
      }
    } catch (e) {
      window.lana.log(`Error: ${e.message} '${source.trim()}'`);
    }
  });
}

export function decorateAutoBlock(a) {
  const config = getConfig();
  const { hostname } = window.location;
  let url;
  try {
    url = new URL(a.href);
  } catch (e) {
    window.lana?.log(`Cannot make URL from decorateAutoBlock - ${a?.href}: ${e.toString()}`);
    return false;
  }

  const href = hostname === url.hostname
    ? `${url.pathname}${url.search}${url.hash}`
    : a.href;

  return config.autoBlocks.find((candidate) => {
    const key = Object.keys(candidate)[0];
    const match = href.includes(candidate[key]);
    if (!match) return false;

    if (key === 'pdf-viewer' && !a.textContent.includes('.pdf')) {
      a.target = '_blank';
      return false;
    }

    if (key === 'fragment') {
      if (a.href === window.location.href) {
        return false;
      }

      const isInlineFrag = url.hash.includes('#_inline');
      if (url.hash === '' || isInlineFrag) {
        const { parentElement } = a;
        const { nodeName, innerHTML } = parentElement;
        const noText = innerHTML === a.outerHTML;
        if (noText && nodeName === 'P') {
          const div = createTag('div', null, a);
          parentElement.parentElement.replaceChild(div, parentElement);
        }
      }

      // previewing a fragment page with mp4 video
      if (a.textContent.match('media_.*.mp4')) {
        a.className = 'video link-block';
        return false;
      }

      // Modals
      if (url.hash !== '' && !isInlineFrag) {
        a.dataset.modalPath = url.pathname;
        a.dataset.modalHash = url.hash;
        a.href = url.hash;
        a.className = `modal link-block ${[...a.classList].join(' ')}`;
        return true;
      }
    }

    // slack uploaded mp4s
    if (key === 'video' && !a.textContent.match('media_.*.mp4')) {
      return false;
    }

    a.className = `${key} link-block`;
    return true;
  });
}

export function decorateLinks(el) {
  decorateImageLinks(el);
  const anchors = el.getElementsByTagName('a');
  return [...anchors].reduce((rdx, a) => {
    appendHtmlToLink(a);
    a.href = localizeLink(a.href);
    decorateSVG(a);
    if (a.href.includes('#_blank')) {
      a.setAttribute('target', '_blank');
      a.href = a.href.replace('#_blank', '');
    }
    if (a.href.includes('#_dnb')) {
      a.href = a.href.replace('#_dnb', '');
    } else {
      const autoBlock = decorateAutoBlock(a);
      if (autoBlock) {
        rdx.push(a);
      }
    }
    return rdx;
  }, []);
}

/**
 * Decorates all sections in a container element.
 * @param {Element} el The container element
 * @param {Boolean} isDoc Is document or fragment
 */
async function decorateSections(el, isDoc) {
  // fixme: our decorateSections gets main while in Milo it gets area.
  //  For us, the selector never changes. That's why isDoc always needs to be false.
  // eslint-disable-next-line no-param-reassign
  isDoc = false;
  const selector = isDoc ? 'body > main > div' : ':scope > div';
  return [...el.querySelectorAll(selector)].map((section, idx) => {
    /* process section metadata */
    const sectionMeta = section.querySelector('div.section-metadata');
    if (sectionMeta) {
      const meta = readBlockConfig(sectionMeta);
      const keys = Object.keys(meta);
      keys.forEach((key) => {
        if (key === 'style') {
          section.classList.add(...meta.style.split(', ').map(toClassName));
        } else if (key === 'anchor') {
          section.id = toClassName(meta.anchor);
        } else if (key === 'background') {
          section.style.background = meta.background;
        } else {
          section.dataset[key] = meta[key];
        }
      });
      sectionMeta.remove();
    }

    const links = decorateLinks(section);

    const blocks = section.querySelectorAll(':scope > div[class]:not(.content, .section-metadata)');

    section.classList.add('section', 'section-wrapper'); // keep .section-wrapper for compatibility
    section.dataset.status = 'decorated';
    section.dataset.idx = idx;

    let defaultContentWrapper;
    [...section.children].forEach((child) => {
      const isDivTag = child.tagName === 'DIV';
      if (isDivTag) {
        defaultContentWrapper = undefined;
      } else {
        if (!defaultContentWrapper) {
          defaultContentWrapper = document.createElement('div');
          defaultContentWrapper.classList.add('default-content-wrapper');
          section.insertBefore(defaultContentWrapper, child);
        }
        defaultContentWrapper.append(child);
      }
    });
    blocks.forEach(async (block) => {
      await decorateBlock(block);
    });
    const blockLinks = [...blocks].reduce((blkLinks, block) => {
      links.filter((link) => block.contains(link))
        .forEach((link) => {
          if (link.classList.contains('link-block')) {
            blkLinks.autoBlocks.push(link);
          }
        });
      return blkLinks;
    }, { autoBlocks: [] });

    return {
      el: section,
      blocks: [...links, ...blocks],
      preloadLinks: blockLinks.autoBlocks,
    };
  });
}

/**
 * Updates all section status in a container element.
 * @param {Element} main The container element
 */
export function updateSectionsStatus(main) {
  const sections = [...main.querySelectorAll(':scope > div.section')];
  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];
    const status = section.getAttribute('data-section-status');
    if (status !== 'loaded') {
      const loadingBlock = section.querySelector('.block[data-block-status="initialized"], .block[data-block-status="loading"]');
      if (loadingBlock) {
        section.setAttribute('data-section-status', 'loading');
        break;
      } else {
        section.setAttribute('data-section-status', 'loaded');
      }
    }
  }
}

export function getCookie(cname) {
  const name = `${cname}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i += 1) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

// TODO probably want to replace / merge this with new getEnv method
export function getHelixEnv() {
  let envName = sessionStorage.getItem('helix-env');
  if (!envName) {
    envName = 'stage';
    if (window.spark?.hostname === 'www.adobe.com') envName = 'prod';
  }
  const envs = {
    stage: {
      commerce: 'commerce-stg.adobe.com',
      adminconsole: 'stage.adminconsole.adobe.com',
      spark: 'stage.projectx.corp.adobe.com',
    },
    prod: {
      commerce: 'commerce.adobe.com',
      spark: 'express.adobe.com',
      adminconsole: 'adminconsole.adobe.com',
    },
  };
  const env = envs[envName];

  const overrideItem = sessionStorage.getItem('helix-env-overrides');
  if (overrideItem) {
    const overrides = JSON.parse(overrideItem);
    const keys = Object.keys(overrides);
    env.overrides = keys;

    for (const a of keys) {
      env[a] = overrides[a];
    }
  }

  if (env) {
    env.name = envName;
  }
  return env;
}

export async function fetchRelevantRows(path) {
  if (!window.relevantRows) {
    try {
      const { prefix } = getConfig().locale;
      const resp = await fetch(`${prefix}/express/relevant-rows.json`);
      window.relevantRows = resp.ok ? (await resp.json()).data : [];
    } catch {
      const resp = await fetch('/express/relevant-rows.json');
      window.relevantRows = resp.ok ? (await resp.json()).data : [];
    }
  }

  if (window.relevantRows.length) {
    const relevantRow = window.relevantRows.find((p) => path === p.path);
    const env = getHelixEnv();

    if (env && env.name === 'stage') {
      return relevantRow || null;
    }

    return relevantRow && relevantRow.live !== 'N' ? relevantRow : null;
  }

  return null;
}

export function addBlockClasses($block, classNames) {
  const $rows = Array.from($block.children);
  $rows.forEach(($row) => {
    classNames.forEach((className, i) => {
      $row.children[i].className = className;
    });
  });
}

// function addDivClasses($element, selector, classes) {
//   const $children = $element.querySelectorAll(selector);
//   $children.forEach(($div, i) => {
//     $div.classList.add(classes[i]);
//   });
// }

function decorateHeaderAndFooter() {
  const header = document.querySelector('header');

  header.addEventListener('click', (event) => {
    if (event.target.id === 'feds-topnav') {
      const root = window.location.href.split('/express/')[0];
      window.location.href = `${root}/express/`;
    }
  });

  const headerMeta = getMetadata('header');
  if (headerMeta !== 'off') header.innerHTML = '<div id="feds-header"></div>';
  else header.remove();
  const footerMeta = getMetadata('footer');
  const footer = document.querySelector('footer');
  if (footerMeta !== 'off') {
    footer.innerHTML = `
      <div id="feds-footer"></div>
    `;
    footer.setAttribute('data-status', 'loading');
  } else footer.remove();
}

export function loadLink(href, {
  as,
  callback,
  crossorigin,
  rel,
} = {}) {
  let link = document.head.querySelector(`link[href="${href}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    if (as) link.setAttribute('as', as);
    if (crossorigin) link.setAttribute('crossorigin', crossorigin);
    link.setAttribute('href', href);
    if (callback) {
      link.onload = (e) => callback(e.type);
      link.onerror = (e) => callback(e.type);
    }
    document.head.appendChild(link);
  } else if (callback) {
    callback('noop');
  }
  return link;
}

export function loadStyle(href, callback) {
  return loadLink(href, { rel: 'stylesheet', callback });
}

function resolveFragments() {
  Array.from(document.querySelectorAll('main > div div'))
    .filter(($cell) => $cell.childElementCount === 0)
    .filter(($cell) => /^\[[A-Za-z\d\s\-_—]+\]$/mg.test($cell.textContent.trim()))
    .forEach(($cell) => {
      const marker = $cell.textContent.trim()
        .substring(1, $cell.textContent.trim().length - 1)
        .toLocaleLowerCase()
        .trim();
      // find the fragment with the marker
      const $marker = Array.from(document.querySelectorAll('main > div h3'))
        .find(($title) => $title.textContent.trim().toLocaleLowerCase() === marker);
      if (!$marker) {
        return;
      }
      let $fragment = $marker.closest('main > div');
      const $markerContainer = $marker.parentNode;
      if ($markerContainer.children.length === 1) {
        // empty section with marker, remove and use content from next section
        const $emptyFragment = $markerContainer.parentNode;
        $fragment = $emptyFragment.nextElementSibling;
        $emptyFragment.remove();
      }
      if (!$fragment) {
        return;
      }
      setTimeout(() => {
        $cell.innerHTML = '';
        Array.from($fragment.children).forEach(($elem) => $cell.appendChild($elem));
        $marker.remove();
        $fragment.remove();
      }, 500);
    });
}

/**
 * scroll to hash
 */

export function scrollToHash() {
  const { hash } = window.location;
  if (hash) {
    const elem = document.querySelector(hash);
    if (elem) {
      setTimeout(() => {
        elem.scrollIntoView({
          block: 'start',
          behavior: 'smooth',
        });
      }, 500);
    }
  }
}

/**
 * Builds a block DOM Element from a two dimensional array
 * @param {string} blockName name of the block
 * @param {any} content two dimensional array or string or object of content
 */
export function buildBlock(blockName, content) {
  const table = Array.isArray(content) ? content : [[content]];
  const blockEl = document.createElement('div');
  // build image block nested div structure
  blockEl.classList.add(blockName);
  table.forEach((row) => {
    const rowEl = document.createElement('div');
    row.forEach((col) => {
      const colEl = document.createElement('div');
      const vals = col.elems ? col.elems : [col];
      vals.forEach((val) => {
        if (val) {
          if (typeof val === 'string') {
            colEl.innerHTML += val;
          } else {
            colEl.appendChild(val);
          }
        }
      });
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return (blockEl);
}

async function loadAndExecute(cssPath, jsPath, block, blockName, eager) {
  const cssLoaded = new Promise((resolve) => {
    loadStyle(cssPath, resolve);
  });
  const scriptLoaded = new Promise((resolve) => {
    (async () => {
      try {
        const { default: init } = await import(jsPath);
        await init(block, blockName, document, eager);
      } catch (err) {
        // eslint-disable-next-line no-console
        window.lana.log(`failed to load module for ${blockName}: ${err.message}\nError Stack:${err.stack}`, {
          sampleRate: 1,
          tags: 'module',
        });
      }
      resolve();
    })();
  });
  await Promise.all([cssLoaded, scriptLoaded]);
}

/**
 * Loads JS and CSS for a block.
 * @param {Element} block The block element
 */
export async function loadBlock(block, eager = false) {
  if (!(block.getAttribute('data-block-status') === 'loading' || block.getAttribute('data-block-status') === 'loaded')) {
    block.setAttribute('data-block-status', 'loading');
    const blockName = block.getAttribute('data-block-name') || block.classList[0];
    let cssPath = `/express/blocks/${blockName}/${blockName}.css`;
    let jsPath = `/express/blocks/${blockName}/${blockName}.js`;

    if (window.hlx.experiment && window.hlx.experiment.run) {
      const { experiment } = window.hlx;
      if (experiment.selectedVariant !== 'control') {
        const { control } = experiment.variants;
        if (control && control.blocks && control.blocks.includes(blockName)) {
          const blockIndex = control.blocks.indexOf(blockName);
          const variant = experiment.variants[experiment.selectedVariant];
          const blockPath = variant.blocks[blockIndex];
          cssPath = `/express/experiments/${experiment.id}/${blockPath}/${blockName}.css`;
          jsPath = `/express/experiments/${experiment.id}/${blockPath}/${blockName}.js`;
        }
      }
    }

    await loadAndExecute(cssPath, jsPath, block, blockName, eager);
    block.setAttribute('data-block-status', 'loaded');
  }
  return block;
}

export const loadScript = (url, type) => new Promise((resolve, reject) => {
  let script = document.querySelector(`head > script[src="${url}"]`);
  if (!script) {
    const { head } = document;
    script = document.createElement('script');
    script.setAttribute('src', url);
    if (type) {
      script.setAttribute('type', type);
    }
    head.append(script);
  }

  if (script.dataset.loaded) {
    resolve(script);
    return;
  }

  const onScript = (event) => {
    script.removeEventListener('load', onScript);
    script.removeEventListener('error', onScript);

    if (event.type === 'error') {
      reject(new Error(`error loading script: ${script.src}`));
    } else if (event.type === 'load') {
      script.dataset.loaded = true;
      resolve(script);
    }
  };

  script.addEventListener('load', onScript);
  script.addEventListener('error', onScript);
});

export async function setTemplateTheme() {
  // todo: remove theme after we move blog to template column in metadata sheet
  const template = getMetadata('template') || getMetadata('theme');
  if (!template || template?.toLowerCase() === 'no brand header') return;
  const name = template.toLowerCase().replace(/[^0-9a-z]/gi, '-');
  document.body.classList.add(name);
  await new Promise((resolve) => {
    loadStyle(`/express/templates/${name}/${name}.css`, resolve);
  });
}

export async function loadTemplateScript() {
  // todo: remove theme after we move blog to template column in metadata sheet
  const template = getMetadata('template') || getMetadata('theme');
  if (!template || template?.toLowerCase() === 'no brand header') return;
  const name = template.toLowerCase().replace(/[^0-9a-z]/gi, '-');
  await new Promise((resolve) => {
    (async () => {
      try {
        await import(`/express/templates/${name}/${name}.js`);
      } catch (err) {
        window.lana.log(`failed to load template module for ${name}`, err);
      }
      resolve();
    })();
  });
}

/**
 * fetches the string variables.
 * @returns {object} localized variables
 */

export async function fetchPlaceholders() {
  const requestPlaceholders = async (url) => {
    const resp = await fetch(url);
    if (resp.ok) {
      const json = await resp.json();
      window.placeholders = {};
      json.data.forEach((placeholder) => {
        if (placeholder.value) window.placeholders[placeholder.key] = placeholder.value;
        else if (placeholder.Text) window.placeholders[placeholder.Key] = placeholder.Text;
      });
    }
  };
  if (!window.placeholders) {
    try {
      const { prefix } = getConfig().locale;
      await requestPlaceholders(`${prefix}/express/placeholders.json`);
    } catch {
      await requestPlaceholders('/express/placeholders.json');
    }
  }
  return window.placeholders;
}

function addPromotion() {
  // check for existing promotion
  if (!document.querySelector('main .promotion')) {
    // extract category from metadata
    const category = getMetadata('category');
    if (category) {
      const promos = {
        photo: 'photoshop',
        design: 'illustrator',
        video: 'premiere',
      };
      // insert promotion at the bottom
      if (promos[category]) {
        const $promoSection = createTag('div', { class: 'section' });
        $promoSection.innerHTML = `<div class="promotion" data-block-name="promotion"><div><div>${promos[category]}</div></div></div>`;
        document.querySelector('main').append($promoSection);
        loadBlock($promoSection.querySelector(':scope .promotion'));
      }
    }
  }
}

async function loadMartech() {
  const usp = new URLSearchParams(window.location.search);
  const martech = usp.get('martech');

  const analyticsUrl = '/express/scripts/instrument.js';
  if (!(martech === 'off' || document.querySelector(`head script[src="${analyticsUrl}"]`))) {
    const mod = await import('./instrument.js');
    mod.default();
  }
}

function loadGnav() {
  const usp = new URLSearchParams(window.location.search);
  const gnav = usp.get('gnav') || getMetadata('gnav');

  const gnavUrl = '/express/scripts/gnav.js';
  if (!(gnav === 'off' || document.querySelector(`head script[src="${gnavUrl}"]`))) {
    loadScript(gnavUrl, 'module');
  }
}

function decoratePageStyle() {
  const isBlog = getMetadata('theme') === 'blog' || getMetadata('template') === 'blog';
  if (!isBlog) {
    const $h1 = document.querySelector('main h1');
    // check if h1 is inside a block
    // eslint-disable-next-line no-lonely-if
    if ($h1 && !$h1.closest('.section > div > div ')) {
      const $heroPicture = $h1.parentElement.querySelector('picture');
      let $heroSection;
      const $main = document.querySelector('main');
      if ($main.children.length === 1) {
        $heroSection = createTag('div', { class: 'hero' });
        const $div = createTag('div');
        $heroSection.append($div);
        if ($heroPicture) {
          $div.append($heroPicture);
        }
        $div.append($h1);
        $main.prepend($heroSection);
      } else {
        $heroSection = $h1.closest('.section');
        $heroSection.classList.add('hero');
        $heroSection.removeAttribute('style');
      }
      if ($heroPicture) {
        $heroPicture.classList.add('hero-bg');
      } else {
        $heroSection.classList.add('hero-noimage');
      }
    }
  }
}

/**
 * Button style applicator function
 * @param {Object} el the container of the buttons to be decorated
 */

export function decorateButtons(el = document) {
  // FIXME: Different function from Milo.
  const noButtonBlocks = ['template-list', 'icon-list'];
  el.querySelectorAll(':scope a:not(.faas.link-block, .fragment.link-block)').forEach(($a) => {
    const originalHref = $a.href;
    const linkText = $a.textContent.trim();
    if ($a.children.length > 0) {
      // We can use this to eliminate styling so only text
      // propagates to buttons.
      $a.innerHTML = $a.innerHTML.replaceAll('<u>', '').replaceAll('</u>', '');
    }
    $a.title = $a.title || linkText;
    const $block = $a.closest('div.section > div > div');
    const { hash } = new URL($a.href);
    let blockName;
    if ($block) {
      blockName = $block.className;
    }

    if (!noButtonBlocks.includes(blockName)
      && originalHref !== linkText
      && !(linkText.startsWith('https') && linkText.includes('/media_'))
      && !/hlx\.blob\.core\.windows\.net/.test(linkText)
      && !linkText.endsWith(' >')
      && !(hash === '#embed-video')
      && !linkText.endsWith(' ›')
      && !linkText.endsWith('.svg')) {
      const $up = $a.parentElement;
      const $twoup = $a.parentElement.parentElement;
      if (!$a.querySelector('img')) {
        if ($up.childNodes.length === 1 && ($up.tagName === 'P' || $up.tagName === 'DIV')) {
          $a.classList.add('button', 'accent'); // default
          $up.classList.add('button-container');
        }
        if ($up.childNodes.length === 1 && $up.tagName === 'STRONG'
          && $twoup.children.length === 1 && $twoup.tagName === 'P') {
          $a.classList.add('button', 'accent');
          $twoup.classList.add('button-container');
        }
        if ($up.childNodes.length === 1 && $up.tagName === 'EM'
          && $twoup.children.length === 1 && $twoup.tagName === 'P') {
          $a.classList.add('button', 'accent', 'light');
          $twoup.classList.add('button-container');
        }
      }
      if (linkText.startsWith('{{icon-') && linkText.endsWith('}}')) {
        const $iconName = /{{icon-([\w-]+)}}/g.exec(linkText)[1];
        if ($iconName) {
          $a.innerHTML = getIcon($iconName, `${$iconName} icon`);
          $a.classList.remove('button', 'primary', 'secondary', 'accent');
          $a.title = $iconName;
        }
      }
    }
  });
}

export function checkTesting() {
  return (getMetadata('testing').toLowerCase() === 'on');
}

/**
 * Sanitizes a string and turns it into camel case.
 * @param {*} name The unsanitized string
 * @returns {string} The camel cased string
 */
export function toCamelCase(name) {
  return toClassName(name).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Gets the experiment name, if any for the page based on env, useragent, queyr params
 * @returns {string} experimentid
 */
export function getExperiment() {
  let experiment = toClassName(getMetadata('experiment'));
  const { hostname } = window.location;
  if (!(/adobe\.com/.test(hostname) || /\.hlx\.live/.test(hostname) || hostname.includes('localhost'))) {
    experiment = '';
    // reason = 'not prod host and not local';
  }
  if (window.location.hash) {
    experiment = '';
    // reason = 'suppressed by #';
  }

  if (navigator.userAgent.match(/bot|crawl|spider/i)) {
    experiment = '';
    // reason = 'bot detected';
  }

  const usp = new URLSearchParams(window.location.search);
  if (usp.has('experiment')) {
    [experiment] = usp.get('experiment').split('/');
  }

  return experiment;
}

/**
 * Gets experiment config from the manifest or the instant experiement
 * metdata and transforms it to more easily consumable structure.
 *
 * the manifest consists of two sheets "settings" and "experiences"
 *
 * "settings" is applicable to the entire test and contains information
 * like "Audience", "Status" or "Blocks".
 *
 * "experience" hosts the experiences in columns, consisting of:
 * a "Percentage Split", "Label" and a set of "Pages".
 *
 *
 * @param {string} experimentId
 * @returns {object} containing the experiment manifest
 */
export async function getExperimentConfig(experimentId) {
  const instantExperiment = getMetadata('instant-experiment');
  if (instantExperiment) {
    const config = {
      experimentName: `Instant Experiment: ${experimentId}`,
      audience: '',
      status: 'Active',
      id: experimentId,
      variants: {},
      variantNames: [],
    };

    const pages = instantExperiment.split(',').map((p) => new URL(p.trim()).pathname);
    const evenSplit = 1 / (pages.length + 1);

    config.variantNames.push('control');
    config.variants.control = {
      percentageSplit: '',
      pages: [window.location.pathname],
      blocks: [],
      label: 'Control',
    };

    pages.forEach((page, i) => {
      const vname = `challenger-${i + 1}`;
      config.variantNames.push(vname);
      config.variants[vname] = {
        percentageSplit: `${evenSplit}`,
        pages: [page],
        label: `Challenger ${i + 1}`,
      };
    });

    return (config);
  } else {
    const path = `/express/experiments/${experimentId}/manifest.json`;
    try {
      const config = {};
      const resp = await fetch(path);
      const json = await resp.json();
      json.settings.data.forEach((line) => {
        const key = toCamelCase(line.Name);
        config[key] = line.Value;
      });
      config.id = experimentId;
      config.manifest = path;
      const variants = {};
      let variantNames = Object.keys(json.experiences.data[0]);
      variantNames.shift();
      variantNames = variantNames.map((vn) => toCamelCase(vn));
      variantNames.forEach((variantName) => {
        variants[variantName] = {};
      });
      let lastKey = 'default';
      json.experiences.data.forEach((line) => {
        let key = toCamelCase(line.Name);
        if (!key) key = lastKey;
        lastKey = key;
        const vns = Object.keys(line);
        vns.shift();
        vns.forEach((vn) => {
          const camelVN = toCamelCase(vn);
          if (key === 'pages' || key === 'blocks') {
            variants[camelVN][key] = variants[camelVN][key] || [];
            if (key === 'pages') variants[camelVN][key].push(new URL(line[vn]).pathname);
            else variants[camelVN][key].push(line[vn]);
          } else {
            variants[camelVN][key] = line[vn];
          }
        });
      });
      config.variants = variants;
      config.variantNames = variantNames;
      return config;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('error loading experiment manifest: %s', path, e);
    }
    return null;
  }
}

function loadIMS() {
  window.adobeid = {
    client_id: 'AdobeExpressWeb',
    scope: 'AdobeID,openid,pps.read,firefly_api,additional_info.roles,read_organizations',
    locale: getConfig().locale.region,
    environment: getConfig().env.ims,
  };
  if (getConfig().env.ims === 'stg1') {
    loadScript('https://auth-stg1.services.adobe.com/imslib/imslib.min.js');
  } else {
    loadScript('https://auth.services.adobe.com/imslib/imslib.min.js');
  }
}

async function loadAndRunExp(config, forcedExperiment, forcedVariant) {
  const promises = [import('./experiment.js')];
  const aepaudiencedevice = getMetadata('aepaudiencedevice').toLowerCase();
  if (aepaudiencedevice === 'all' || aepaudiencedevice === document.body.dataset?.device) {
    loadIMS();
    // rush instrument-martech-launch-alloy
    promises.push(loadMartech());
    window.delay_preload_product = true;
  }
  const [{ runExps }] = await Promise.all(promises);
  await runExps(config, forcedExperiment, forcedVariant);
}

/**
 * checks if a test is active on this page and if so executes the test
 */
async function decorateTesting() {
  try {
    const usp = new URLSearchParams(window.location.search);

    const experiment = getExperiment();
    const [forcedExperiment, forcedVariant] = usp.get('experiment') ? usp.get('experiment').split('/') : [];

    if (experiment) {
      const config = await getExperimentConfig(experiment);
      if (config && (toCamelCase(config.status) === 'active' || forcedExperiment)) {
        await loadAndRunExp(config, forcedExperiment, forcedVariant);
      }
    }
    const martech = usp.get('martech');
    if ((checkTesting() && (martech !== 'off') && (martech !== 'delay')) || martech === 'rush') {
      // eslint-disable-next-line no-console
      console.log('rushing martech');
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('error testing', e);
  }
}

/**
 * Icon loader using altText
 * @param {Object} el the container of the buttons to be decorated
 */

export async function fixIcons(el = document) {
  /* backwards compatible icon handling, deprecated */
  el.querySelectorAll('svg use[href^="./_icons_"]').forEach(($use) => {
    $use.setAttribute('href', `/express/icons.svg#${$use.getAttribute('href').split('#')[1]}`);
  });
  const placeholders = await fetchPlaceholders();
  /* new icons handling */
  el.querySelectorAll('img').forEach(($img) => {
    const alt = $img.getAttribute('alt');
    if (alt) {
      const lowerAlt = alt.toLowerCase();
      if (lowerAlt.includes('icon:')) {
        const [icon, mobileIcon] = lowerAlt
          .split(';')
          .map((i) => {
            if (i) {
              return toClassName(i.split(':')[1].trim());
            }
            return null;
          });
        let altText = null;
        if (placeholders[icon]) {
          altText = placeholders[icon];
        } else if (placeholders[mobileIcon]) {
          altText = placeholders[mobileIcon];
        }
        const $picture = $img.closest('picture');
        const $block = $picture.closest('.block');
        let size = 44;
        if ($block) {
          const blockName = $block.getAttribute('data-block-name');
          // use small icons in .columns (except for .columns.offer)
          if (blockName === 'columns') {
            size = $block.classList.contains('offer') ? 44 : 22;
          } else if (blockName === 'toc') {
            // ToC block has its own logic
            return;
          }
        }
        $picture.parentElement
          .replaceChild(getIconElement([icon, mobileIcon], size, altText), $picture);
      }
    }
  });
}

function unwrapBlock($block) {
  const $section = $block.parentNode;
  const $elems = [...$section.children];

  if ($elems.length <= 1) return;

  const $blockSection = createTag('div');
  const $postBlockSection = createTag('div');
  const $nextSection = $section.nextElementSibling;
  $section.parentNode.insertBefore($blockSection, $nextSection);
  $section.parentNode.insertBefore($postBlockSection, $nextSection);

  let $appendTo;
  $elems.forEach(($e) => {
    if ($e === $block || ($e.className === 'section-metadata')) {
      $appendTo = $blockSection;
    }

    if ($appendTo) {
      $appendTo.appendChild($e);
      $appendTo = $postBlockSection;
    }
  });

  if (!$postBlockSection.hasChildNodes()) {
    $postBlockSection.remove();
  }
}

export function normalizeHeadings(block, allowedHeadings) {
  const allowed = allowedHeadings.map((h) => h.toLowerCase());
  block.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((tag) => {
    const h = tag.tagName.toLowerCase();
    if (allowed.indexOf(h) === -1) {
      // current heading is not in the allowed list -> try first to "promote" the heading
      let level = parseInt(h.charAt(1), 10) - 1;
      while (allowed.indexOf(`h${level}`) === -1 && level > 0) {
        level -= 1;
      }
      if (level === 0) {
        // did not find a match -> try to "downgrade" the heading
        while (allowed.indexOf(`h${level}`) === -1 && level < 7) {
          level += 1;
        }
      }
      if (level !== 7) {
        tag.outerHTML = `<h${level}>${tag.textContent.trim()}</h${level}>`;
      }
    }
  });
}

export async function fetchBlockFragDecorated(url, blockName) {
  const location = new URL(window.location);
  const { prefix } = getConfig().locale;
  const fragmentUrl = `${location.origin}${prefix}${url}`;

  const path = new URL(fragmentUrl).pathname.split('.')[0];
  const resp = await fetch(`${path}.plain.html`);
  if (resp.status === 404) {
    return null;
  } else {
    const html = await resp.text();
    const section = createTag('div');
    section.innerHTML = html;
    section.className = `section section-wrapper ${blockName}-container`;
    const block = section.querySelector(`.${blockName}`);
    block.dataset.blockName = blockName;
    block.parentElement.className = `${blockName}-wrapper`;
    block.classList.add('block');
    const img = section.querySelector('img');
    if (img) {
      img.setAttribute('loading', 'lazy');
    }
    return section;
  }
}

async function buildAutoBlocks(main) {
  const lastDiv = main.querySelector(':scope > div:last-of-type');

  // Load the branch.io banner autoblock...
  if (['yes', 'true', 'on'].includes(getMetadata('show-banner').toLowerCase())) {
    const branchio = buildBlock('branch-io', '');
    if (lastDiv) {
      lastDiv.append(branchio);
    }
  }

  if (['yes', 'true', 'on'].includes(getMetadata('show-relevant-rows').toLowerCase()) && document.body.dataset.device === 'mobile') {
    const authoredRRFound = [
      '.template-list.horizontal.fullwidth.mini',
      '.link-list.noarrows',
      '.collapsible-card',
    ].every((block) => main.querySelector(block));

    if (!authoredRRFound && !window.relevantRowsLoaded) {
      const relevantRowsData = await fetchRelevantRows(window.location.pathname);

      if (relevantRowsData) {
        const relevantRowsSection = createTag('div');
        const fragment = buildBlock('fragment', '/express/fragments/relevant-rows-default-v2');
        relevantRowsSection.dataset.audience = 'mobile';
        relevantRowsSection.append(fragment);
        main.prepend(relevantRowsSection);
        window.relevantRowsLoaded = true;
      }
    }
  }

  async function loadFloatingCTA(BlockMediator) {
    const validButtonVersion = ['floating-button', 'multifunction-button', 'bubble-ui-button', 'floating-panel'];
    const device = document.body.dataset?.device;
    const blockName = getMetadata(`${device}-floating-cta`);

    if (blockName && validButtonVersion.includes(blockName) && lastDiv) {
      const button = buildBlock(blockName, device);
      button.classList.add('metadata-powered');
      lastDiv.append(button);
      BlockMediator.set('floatingCtasLoaded', true);
    }
  }

  if (['yes', 'y', 'true', 'on'].includes(getMetadata('show-floating-cta')?.toLowerCase())) {
    const { default: BlockMediator } = await import('./block-mediator.min.js');

    if (!BlockMediator.get('floatingCtasLoaded')) {
      await loadFloatingCTA(BlockMediator);
    }
  }

  if (getMetadata('show-quick-action-card') && !['no', 'false', 'off'].includes(getMetadata('show-quick-action-card').toLowerCase())) {
    const fragmentName = getMetadata('show-quick-action-card').toLowerCase();
    const quickActionCardBlock = buildBlock('quick-action-card', fragmentName);
    quickActionCardBlock.classList.add('spreadsheet-powered');
    if (lastDiv) {
      lastDiv.append(quickActionCardBlock);
    }
  }
}

function splitSections(main) {
  main.querySelectorAll(':scope > div > div').forEach((block) => {
    const blocksToSplit = ['template-list', 'layouts', 'banner', 'promotion'];
    // work around for splitting columns and sixcols template list
    // add metadata condition to minimize impact on other use cases

    if (blocksToSplit.includes(block.className)) {
      unwrapBlock(block);
    }
  });
}

function decorateLinkedPictures($main) {
  /* thanks to word online */
  $main.querySelectorAll(':scope > picture').forEach(($picture) => {
    if (!$picture.closest('div.block')) {
      linkPicture($picture);
    }
  });
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.replaceWith(link);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

function decorateSocialIcons($main) {
  $main.querySelectorAll(':scope a').forEach(($a) => {
    const urlObject = new URL($a.href);

    if (urlObject.hash === '#embed-video') return;
    if ($a.closest('.block')?.dataset.blockName === 'embed') return;

    if ($a.href === $a.textContent.trim()) {
      let icon = '';
      if (urlObject.hostname === 'www.instagram.com') {
        icon = 'instagram';
      }
      if (urlObject.hostname === 'www.twitter.com') {
        icon = 'twitter';
      }
      if (urlObject.hostname.split('.')[1] === 'pinterest') {
        icon = 'pinterest';
      }
      if (urlObject.hostname.split('.')[1] === 'facebook') {
        icon = 'facebook';
      }
      if (urlObject.hostname === 'www.linkedin.com') {
        icon = 'linkedin';
      }
      if (urlObject.hostname === 'www.youtube.com') {
        icon = 'youtube';
      }
      if (urlObject.hostname === 'www.tiktok.com') {
        icon = 'tiktok';
      }
      const $parent = $a.parentElement;
      if (!icon && $parent.previousElementSibling && $parent.previousElementSibling.classList.contains('social-links')) {
        icon = 'globe';
      }

      if (icon) {
        $a.innerHTML = '';
        const $icon = getIconElement(icon, 22);
        $icon.classList.add('social');
        $a.appendChild($icon);
        if ($parent.previousElementSibling && $parent.previousElementSibling.classList.contains('social-links')) {
          $parent.previousElementSibling.appendChild($a);
          $parent.remove();
        } else {
          $parent.classList.add('social-links');
        }
      }
    }
  });
}

function displayOldLinkWarning() {
  if (window.location.hostname.includes('localhost') || window.location.hostname.includes('.hlx.page')) {
    document.querySelectorAll('main a[href^="https://spark.adobe.com/"]').forEach(($a) => {
      $a.style.border = '10px solid red';
    });
  }
}

function setHelixEnv(name, overrides) {
  if (name) {
    sessionStorage.setItem('helix-env', name);
    if (overrides) {
      sessionStorage.setItem('helix-env-overrides', JSON.stringify(overrides));
    } else {
      sessionStorage.removeItem('helix-env-overrides');
    }
  } else {
    sessionStorage.removeItem('helix-env');
    sessionStorage.removeItem('helix-env-overrides');
  }
}

function displayEnv() {
  try {
    /* setup based on URL Params */
    const usp = new URLSearchParams(window.location.search);
    if (usp.has('helix-env')) {
      const env = usp.get('helix-env');
      setHelixEnv(env);
    }

    /* setup based on referrer */
    if (document.referrer) {
      const url = new URL(document.referrer);
      const expressEnvs = ['express-stage.adobe.com', 'express-qa.adobe.com', 'express-dev.adobe.com'];
      if (url.hostname.endsWith('.adobeprojectm.com') || expressEnvs.includes(url.hostname)) {
        setHelixEnv('stage', { spark: url.host });
      }
      if (window.location.hostname !== url.hostname) {
        // eslint-disable-next-line no-console
        console.log(`external referrer detected: ${document.referrer}`);
      }
    }

    const env = sessionStorage.getItem('helix-env');
    if (env) {
      const $helixEnv = createTag('div', { class: 'helix-env' });
      $helixEnv.textContent = env + (getHelixEnv() ? '' : ' [not found]');
      document.body.appendChild($helixEnv);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(`display env failed: ${e.message}`);
  }
}

/**
 * Returns a picture element with webp and fallbacks
 * @param {string} src The image URL
 * @param {string} alt The alt text of the image
 * @param {boolean} eager load image eager
 * @param {Array} breakpoints breakpoints and corresponding params (eg. width)
 */

export function createOptimizedPicture(src, alt = '', eager = false, breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }]) {
  const url = new URL(src, window.location.href);
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
    }
  });

  return picture;
}

function decoratePictures(main) {
  main.querySelectorAll('img[src*="/media_"]').forEach((img, i) => {
    const newPicture = createOptimizedPicture(img.src, img.alt, !i);
    const picture = img.closest('picture');
    if (picture) picture.parentElement.replaceChild(newPicture, picture);
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 * @param {Boolean} isDoc Is document or fragment
 */
export async function decorateMain(main, isDoc) {
  await buildAutoBlocks(main);
  splitSections(main);
  const sections = decorateSections(main, isDoc);
  decorateButtons(main);
  await fixIcons(main);
  decoratePictures(main);
  decorateLinkedPictures(main);
  decorateSocialIcons(main);

  await sections;
  return sections;
}

function unhideBody() {
  try {
    const id = ('alloy-prehiding');
    document.head.removeChild(document.getElementById(id));
  } catch (e) {
    // nothing
  }
}

function hideBody() {
  const id = 'alloy-prehiding';
  let style = document.getElementById(id);
  if (style) {
    return;
  }
  style = document.createElement('style');
  style.id = 'alloy-prehiding';
  style.innerHTML = '.personalization-container{opacity:0.01 !important}';

  try {
    document.head.appendChild(style);
  } catch (e) {
    // nothing
  }
}

export function toggleVideo(target) {
  const videos = target.querySelectorAll('video');
  const paused = videos[0] ? videos[0].paused : false;
  videos.forEach((video) => {
    if (paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // ignore
        });
      }
    } else video.pause();
  });
}

export function addAnimationToggle(target) {
  target.addEventListener('click', () => {
    toggleVideo(target);
  }, true);
  target.addEventListener('keypress', (e) => {
    if (e.key !== 'Enter' && e.keyCode !== 32 && e.key !== ' ') {
      return;
    }
    e.preventDefault();
    toggleVideo(target);
  }, true);
}

/**
 * Searches for Japanese text in headings and applies a smart word-breaking algorithm by surrounding
 * semantic blocks with spans. This allows browsers to break japanese sentences correctly.
 */
async function wordBreakJapanese() {
  if (getConfig().locale.region !== 'jp') {
    return;
  }
  const { loadDefaultJapaneseParser } = await import('./budoux-index-ja.min.js');
  const parser = loadDefaultJapaneseParser();
  document.querySelectorAll('h1, h2, h3, h4, h5').forEach((el) => {
    el.classList.add('budoux');
    parser.applyElement(el);
  });

  const BalancedWordWrapper = (await import('./bw2.js')).default;
  const bw2 = new BalancedWordWrapper();
  document.querySelectorAll('h1, h2, h3, h4, h5').forEach((el) => {
    // apply balanced word wrap to headings
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => {
        bw2.applyElement(el);
      });
    } else {
      window.setTimeout(() => {
        bw2.applyElement(el);
      }, 1000);
    }
  });
}

/**
 * Calculate a relatively more accurate "character count" for mixed Japanese
 * + English texts, for the purpose of heading auto font sizing.
 *
 * The rationale is that English characters are usually narrower than Japanese
 * ones. Hence each English character (and space character) is multiplied by an
 * coefficient before being added to the total character count. The current
 * coefficient value, 0.57, is an empirical value from some tests.
 */
function getJapaneseTextCharacterCount(text) {
  const headingEngCharsRegEx = /[a-zA-Z0-9 ]+/gm;
  const matches = text.matchAll(headingEngCharsRegEx);
  const eCnt = [...matches].map((m) => m[0]).reduce((cnt, m) => cnt + m.length, 0);
  const jtext = text.replaceAll(headingEngCharsRegEx, '');
  const jCnt = jtext.length;
  return eCnt * 0.57 + jCnt;
}

/**
 * Add dynamic font sizing CSS class names to headings
 *
 * The CSS class names are determined by character counts.
 * @param {Element} $block The container element
 * @param {string} classPrefix Prefix in CSS class names before "-long", "-very-long", "-x-long".
 * Default is "heading".
 * @param {string} selector CSS selector to select the target heading tags. Default is "h1, h2".
 */
export function addHeaderSizing($block, classPrefix = 'heading', selector = 'h1, h2') {
  const headings = $block.querySelectorAll(selector);
  // Each threshold of JP should be smaller than other languages
  // because JP characters are larger and JP sentences are longer
  const sizes = getConfig().locale.region === 'jp'
    ? [
      { name: 'long', threshold: 8 },
      { name: 'very-long', threshold: 11 },
      { name: 'x-long', threshold: 15 },
    ]
    : [
      { name: 'long', threshold: 30 },
      { name: 'very-long', threshold: 40 },
      { name: 'x-long', threshold: 50 },
    ];
  headings.forEach((h) => {
    const length = getConfig().locale.region === 'jp'
      ? getJapaneseTextCharacterCount(h.textContent.trim())
      : h.textContent.trim().length;
    sizes.forEach((size) => {
      if (length >= size.threshold) h.classList.add(`${classPrefix}-${size.name}`);
    });
  });
}

/**
 * Call `addHeaderSizing` on default content blocks in all section blocks
 * in all Japanese pages except blog pages.
 */
function addJapaneseSectionHeaderSizing() {
  if (getConfig().locale.region === 'jp') {
    document.querySelectorAll('body:not(.blog) .section .default-content-wrapper').forEach((el) => {
      addHeaderSizing(el);
    });
  }
}

/**
 * Detects legal copy based on a * or † prefix and applies a smaller font size.
 * @param {Element} main The main element
 */
function decorateLegalCopy(main) {
  const legalCopyPrefixes = ['*', '†'];
  main.querySelectorAll('p').forEach(($p) => {
    const pText = $p.textContent.trim() ? $p.textContent.trim().charAt(0) : '';
    if (pText && legalCopyPrefixes.includes(pText)) {
      $p.classList.add('legal-copy');
    }
  });
}

export function loadLana(options = {}) {
  if (window.lana) return;

  const lanaError = (e) => {
    window.lana.log(e.reason || e.error || e.message, {
      errorType: 'i',
    });
  };

  window.lana = {
    log: async (...args) => {
      await import('./lana.js');
      window.removeEventListener('error', lanaError);
      window.removeEventListener('unhandledrejection', lanaError);
      return window.lana.log(...args);
    },
    debug: false,
    options,
  };

  window.addEventListener('error', lanaError);
  window.addEventListener('unhandledrejection', lanaError);
}

function removeMetadata() {
  document.head.querySelectorAll('meta').forEach((meta) => {
    if (meta.content && meta.content.includes('--none--')) {
      meta.remove();
    }
  });
}

/**
 * loads everything that doesn't need to be delayed.
 */
async function loadLazy(main) {
  addPromotion();
  loadStyle('/express/styles/lazy-styles.css');
  scrollToHash();
  resolveFragments();
  removeMetadata();
  addFavIcon('/express/icons/cc-express.svg');
  sampleRUM('lazy');
  sampleRUM.observe(document.querySelectorAll('main picture > img'));
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  trackViewedAssetsInDataLayer([
    'img[src*="/media_"]',
    'img[src*="https://design-assets.adobeprojectm.com/"]',
  ]);
}

async function loadPostLCP(config) {
  // post LCP actions go here
  sampleRUM('lcp');
  window.dispatchEvent(new Event('milo:LCP:loaded'));
  if (window.hlx.martech) window.hlx.martechLoaded = loadMartech();
  loadGnav();
  const { default: loadFonts } = await import('./fonts.js');
  loadFonts(config.locale, loadStyle);
}

/**
 * Loads JS and CSS for all blocks in a container element.
 * @param {Array} sections The sections loaded in main
 * @param {Boolean} isDoc if is the document or fragment
 */
export async function loadSections(sections, isDoc) {
  const areaBlocks = [];
  for (const section of sections) {
    if (section.preloadLinks.length) {
      const preloads = section.preloadLinks.map((block) => loadBlock(block));
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(preloads);
    }
    const loaded = section.blocks.map((block) => loadBlock(block));
    areaBlocks.push(...section.blocks);

    // Only move on to the next section when all blocks are loaded.
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(loaded);
    // Post LCP operations.
    if (section.el.dataset.idx === '0' && isDoc) loadPostLCP(getConfig());

    // Show the section when all blocks inside are done.
    delete section.el.dataset.status;
    delete section.el.dataset.idx;
  }

  return areaBlocks;
}

function initSidekick() {
  const initPlugins = async () => {
    const { default: init } = await import('./utils/sidekick.js');
    init();
  };

  if (document.querySelector('helix-sidekick')) {
    initPlugins();
  } else {
    document.addEventListener('sidekick-ready', () => {
      initPlugins();
    });
  }
}

/**
 * Decorates the page.
 */
export async function loadArea(area = document) {
  const isDoc = area === document;
  const main = area.querySelector('main');

  if (isDoc) {
    decorateHeaderAndFooter();
  }

  window.hlx = window.hlx || {};
  const params = new URLSearchParams(window.location.search);
  const experimentParams = params.get('experiment');
  ['martech', 'gnav', 'testing', 'preload_product'].forEach((p) => {
    window.hlx[p] = params.get('lighthouse') !== 'on' && params.get(p) !== 'off';
  });
  window.hlx.experimentParams = experimentParams;
  window.hlx.init = true;

  await setTemplateTheme();

  if (window.hlx.testing) await decorateTesting();

  if (getMetadata('sheet-powered') === 'Y' || window.location.href.includes('/express/templates/')) {
    const { default: replaceContent } = await import('./content-replace.js');
    await replaceContent(main);
  }

  if (getMetadata('template-search-page') === 'Y') {
    const { default: redirect } = await import('./template-redirect.js');
    await redirect();
  }

  let sections = [];
  if (main) {
    sections = await decorateMain(main, isDoc);
    decoratePageStyle();
    decorateLegalCopy(main);
    addJapaneseSectionHeaderSizing();
    displayEnv();
    displayOldLinkWarning();
    wordBreakJapanese();

    if (window.hlx.testing) {
      const target = checkTesting();
      document.querySelector('body').classList.add('personalization-container');
      // target = true;
      if (target) {
        hideBody();
        setTimeout(() => {
          unhideBody();
        }, 3000);
      }
    }
  }
  await loadTemplateScript();
  await loadSections(sections, isDoc);
  const footer = document.querySelector('footer');
  delete footer.dataset.status;

  initSidekick();

  const lazy = loadLazy(main);

  const buttonOff = params.get('button') === 'off';
  if ((window.location.hostname.endsWith('hlx.page') || window.location.hostname === ('localhost')) && !buttonOff) {
    import('../../tools/preview/preview.js');
  }
  await lazy;

  const { default: delayed } = await import('./delayed.js');
  delayed([getConfig, getMetadata, loadScript, loadStyle]);

  // milo's links featurecc
  const config = getConfig();
  if (config.links === 'on') {
    const path = `${config.contentRoot || ''}${getMetadata('links-path') || '/express/seo/links.json'}`;
    import('../features/links.js').then((mod) => mod.default(path, area));
  }

  import('./attributes.js').then((analytics) => {
    document.querySelectorAll('main > div').forEach((section, idx) => analytics.decorateSectionAnalytics(section, idx, config));
  });

  window.hlx.martechLoaded?.then(() => import('./legacy-analytics.js')).then(({ default: decorateTrackingEvents }) => {
    decorateTrackingEvents();
  });
}

export function getMobileOperatingSystem() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Windows Phone must come first because its UA also contains "Android"
  if (/windows phone/i.test(userAgent)) {
    return 'Windows Phone';
  }

  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS';
  }

  return 'unknown';
}

export function titleCase(str) {
  const splitStr = str.toLowerCase().split(' ');
  for (let i = 0; i < splitStr.length; i += 1) {
    splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  return splitStr.join(' ');
}

export function createIntersectionObserver({
  el, callback, once = true, options = {},
}) {
  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach(async (entry) => {
      if (entry.isIntersecting) {
        if (once) observer.unobserve(entry.target);
        callback(entry.target, entry);
      }
    });
  }, options);
  io.observe(el);
  return io;
}

/*
 * lighthouse performance instrumentation helper
 * (needs a refactor)
 */

export function stamp(message) {
  if (window.name.includes('performance')) {
    // eslint-disable-next-line no-console
    console.log(`${new Date() - performance.timing.navigationStart}:${message}`);
  }
}

export function registerPerformanceLogger() {
  try {
    const polcp = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      stamp(JSON.stringify(entries));
      // eslint-disable-next-line no-console
      console.log(entries[0].element);
    });
    polcp.observe({ type: 'largest-contentful-paint', buffered: true });

    const pols = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      stamp(JSON.stringify(entries));
      // eslint-disable-next-line no-console
      console.log(entries[0].sources[0].node);
    });
    pols.observe({ type: 'layout-shift', buffered: true });

    const polt = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Log the entry and all associated details.
        stamp(JSON.stringify(entry));
      }
    });

    // Start listening for `longtask` entries to be dispatched.
    polt.observe({ type: 'longtask', buffered: true });

    const pores = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        stamp(`resource loaded: ${entry.name} - [${Math.round(entry.startTime + entry.duration)}]`);
      });
    });

    pores.observe({ type: 'resource', buffered: true });
  } catch (e) {
    // no output
  }
}
