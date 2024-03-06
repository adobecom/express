/* global _satellite __satelliteLoadedCallback alloy */

import {
  loadScript,
  getConfig,
  checkTesting,
  getAssetDetails,
  getMetadata,
  fetchPlaceholders,
} from './utils.js';

const usp = new URLSearchParams(window.location.search);
const martech = usp.get('martech');
const w = window;
const d = document;
const loc = w.location;
const { pathname } = loc;
let sparkLandingPageType;

// alloy feature flag
let martechURL;
if (
  (window.spark && window.spark.hostname === 'www.stage.adobe.com')
  || martech === 'alloy-qa'
) {
  martechURL = 'https://www.adobe.com/marketingtech/main.standard.qa.js';
} else {
  martechURL = 'https://www.adobe.com/marketingtech/main.standard.min.js';
}

window.marketingtech = {
  adobe: {
    launch: {
      url: (
        (
          (window.spark && window.spark.hostname === 'www.stage.adobe.com')
          || martech === 'alloy-qa'
        )
          ? 'https://assets.adobedtm.com/d4d114c60e50/a0e989131fd5/launch-2c94beadc94f-development.js'
          : 'https://assets.adobedtm.com/d4d114c60e50/a0e989131fd5/launch-5dd5dd2177e6.min.js'
      ),
    },
    alloy: {
      edgeConfigId: (
        (
          (window.spark && window.spark.hostname === 'www.stage.adobe.com')
          || martech === 'alloy-qa'
        )
          ? '8d2805dd-85bf-4748-82eb-f99fdad117a6'
          : '2cba807b-7430-41ae-9aac-db2b0da742d5'
      ),
    },
    target: checkTesting(),
    audienceManager: true,
  },
};
// w.targetGlobalSettings = w.targetGlobalSettings || {};
// w.targetGlobalSettings.bodyHidingEnabled = checkTesting();

function getPlacement(btn) {
  const parentBlock = btn.closest('.block');
  let placement = 'outside-blocks';

  if (parentBlock) {
    const blockName = parentBlock.dataset.blockName || parentBlock.classList[0];
    const sameBlocks = btn.closest('main')?.querySelectorAll(`.${blockName}`);

    if (sameBlocks && sameBlocks.length > 1) {
      sameBlocks.forEach((b, i) => {
        if (b === parentBlock) {
          placement = `${blockName}-${i + 1}`;
        }
      });
    } else {
      placement = blockName;
    }

    if (['template-list', 'template-x'].includes(blockName) && btn.classList.contains('placeholder')) {
      placement = 'blank-template-cta';
    }
  }

  return placement;
}

function set(path, value) {
  const obj = w.alloy_all;
  const newPath = `data._adobe_corpnew.digitalData.${path}`;
  const segs = newPath.split('.');
  let temp = obj;
  let i = 0;
  const il = segs.length - 1;
  // get to the path
  // eslint-disable-next-line no-plusplus
  for (; i < il; i++) {
    const seg = segs[i];
    temp[seg] = temp[seg] || {};
    temp = temp[seg];
  }
  // set the value
  temp[segs[i]] = value;
  return obj;
}

export function sendEventToAdobeAnaltics(eventName) {
  _satellite.track('event', {
    xdm: {},
    data: {
      eventType: 'web.webinteraction.linkClicks',
      web: {
        webInteraction: {
          name: eventName,
          linkClicks: {
            value: 1,
          },
          type: 'other',
        },
      },
      _adobe_corpnew: {
        digitalData: {
          primaryEvent: {
            eventInfo: {
              eventName,
            },
          },
        },
      },
    },
  });
}

export function textToName(text) {
  const splits = text.toLowerCase().split(' ');
  const camelCase = splits.map((s, i) => (i ? s.charAt(0).toUpperCase() + s.substr(1) : s)).join('');
  return (camelCase);
}

export async function trackBranchParameters($links) {
  const placeholders = await fetchPlaceholders();
  const rootUrl = new URL(window.location.href);
  const rootUrlParameters = rootUrl.searchParams;

  const { experiment } = window.hlx;
  const { referrer } = window.document;
  const experimentStatus = experiment ? experiment.status.toLocaleLowerCase() : null;
  const templateSearchTag = getMetadata('branch-search-term') || getMetadata('short-title');
  const canvasHeight = getMetadata('branch-canvas-height');
  const canvasWidth = getMetadata('branch-canvas-width');
  const canvasUnit = getMetadata('branch-canvas-unit');
  const sceneline = getMetadata('branch-sceneline');
  const pageUrl = window.location.pathname;
  const sdid = rootUrlParameters.get('sdid');
  const mv = rootUrlParameters.get('mv');
  const mv2 = rootUrlParameters.get('mv2');
  const sKwcId = rootUrlParameters.get('s_kwcid');
  const efId = rootUrlParameters.get('ef_id');
  const promoId = rootUrlParameters.get('promoid');
  const trackingId = rootUrlParameters.get('trackingid');
  const cgen = rootUrlParameters.get('cgen');

  $links.forEach(($a) => {
    if ($a.href && $a.href.match('adobesparkpost.app.link')) {
      const btnUrl = new URL($a.href);
      const urlParams = btnUrl.searchParams;
      const placement = getPlacement($a);

      if (templateSearchTag
          && placeholders['search-branch-links']?.replace(/\s/g, '').split(',').includes(`${btnUrl.origin}${btnUrl.pathname}`)) {
        urlParams.set('q', templateSearchTag);
        urlParams.set('category', 'templates');
      }

      if (referrer) {
        urlParams.set('referrer', referrer);
      }

      if (pageUrl) {
        urlParams.set('url', pageUrl);
      }

      if (canvasHeight) {
        urlParams.set('height', canvasHeight);
      }

      if (canvasWidth) {
        urlParams.set('width', canvasWidth);
      }

      if (canvasUnit) {
        urlParams.set('unit', canvasUnit);
      }

      if (sceneline) {
        urlParams.set('sceneline', sceneline);
      }

      if (sdid) {
        urlParams.set('sdid', sdid);
      }

      if (mv) {
        urlParams.set('mv', mv);
      }

      if (mv2) {
        urlParams.set('mv2', mv2);
      }

      if (efId) {
        urlParams.set('efid', efId);
      }

      if (sKwcId) {
        const sKwcIdParameters = sKwcId.split('!');

        if (typeof sKwcIdParameters[2] !== 'undefined' && sKwcIdParameters[2] === '3') {
          urlParams.set('customer_placement', 'Google%20AdWords');
        }

        if (typeof sKwcIdParameters[8] !== 'undefined' && sKwcIdParameters[8] !== '') {
          urlParams.set('keyword', sKwcIdParameters[8]);
        }
      }

      if (promoId) {
        urlParams.set('promoid', promoId);
      }

      if (trackingId) {
        urlParams.set('trackingid', trackingId);
      }

      if (cgen) {
        urlParams.set('cgen', cgen);
      }

      if (experimentStatus === 'active') {
        urlParams.set('expid', `${experiment.id}-${experiment.selectedVariant}`);
      }

      if (placement) {
        urlParams.set('ctaid', placement);
      }

      btnUrl.search = urlParams.toString();
      $a.href = decodeURIComponent(btnUrl.toString());
    }
  });
}

export function appendLinkText(eventName, a) {
  if (!a) return eventName;

  if (a.getAttribute('title')?.trim()) {
    return eventName + textToName(a.getAttribute('title').trim());
  }

  if (a.getAttribute('aria-label')?.trim()) {
    return eventName + textToName(a.getAttribute('aria-label').trim());
  }

  if (a.textContent?.trim()) {
    return eventName + textToName(a.textContent.trim());
  }

  const img = a.querySelector('img');
  const alt = img?.getAttribute('alt');
  if (alt) {
    return eventName + textToName(alt);
  }

  if (a.className) {
    return eventName + textToName(a.className);
  }

  return eventName;
}

export function trackButtonClick(a) {
  let adobeEventName = 'adobe.com:express:cta:';
  let hemingwayAssetId;
  let hemingwayAssetPath;
  let hemingwayAssetPosition;

  const hemingwayAsset = a.querySelector('picture,video,audio,img')
      || a.closest('[class*="-container"],[class*="-wrapper"]')?.querySelector('picture,video,audio,img');
  const block = a.closest('.block');
  const urlConstructable = a.href || a.currentSrc || a.src;
  if (hemingwayAsset && block && urlConstructable) {
    const { assetId, assetPath } = getAssetDetails(hemingwayAsset);
    hemingwayAssetPath = assetPath;
    hemingwayAssetId = assetId;

    const siblings = [...block
      .querySelectorAll(`.${a.className.split(' ').join('.')}`)];
    hemingwayAssetPosition = siblings.indexOf(a);
  }

  const $templateContainer = a.closest('.template-list');
  const $tutorialContainer = a.closest('.tutorial-card');
  const $contentToggleContainer = a.closest('.content-toggle');
  const $chooseYourPathContainer = a.closest('.choose-your-path');
  // let cardPosition;
  // Template button click
  if ($templateContainer) {
    adobeEventName += 'template:';

    const $img = a.querySelector('img');

    // try to get the image alternate text
    if (a.classList.contains('template-title-link')) {
      adobeEventName += 'viewAll';
    } else if (a.classList.contains('placeholder')) {
      adobeEventName += 'createFromScratch';
    } else if ($img && $img.alt) {
      adobeEventName += textToName($img.alt);
    } else {
      adobeEventName += 'Click';
    }
    // Button in the FAQ
  } else if ($tutorialContainer) {
    const videoName = textToName(a.querySelector('h3').textContent.trim());
    adobeEventName = `${adobeEventName}tutorials:${videoName}:tutorialPressed`;
  } else if ($chooseYourPathContainer) {
    const $slideTitle = a.querySelector('.choose-your-path-slide-title');
    const slideName = $slideTitle ? textToName($slideTitle.textContent.trim()) : 'slide';

    adobeEventName = `${adobeEventName}chooseYourPath:${slideName}:slidePressed`;
  } else if ($contentToggleContainer) {
    const toggleName = textToName(a.textContent.trim());
    adobeEventName = `${adobeEventName}contentToggle:${toggleName}:buttonPressed`;
  } else if (a.classList.contains('floating-button-lottie')) {
    adobeEventName = `${adobeEventName}floatingButton:scrollPressed`;
  } else if (a.classList.contains('video-player-inline-player-overlay')) {
    const sessionName = a.parentNode.parentNode.parentNode.querySelector('.video-player-session-number').textContent.trim();
    const videoName = a.parentNode.parentNode.parentNode.querySelector('.video-player-video-title').textContent.trim();
    adobeEventName = `${adobeEventName}playing:${sessionName}-${videoName}`;
  } else if (a.classList.contains('notch')) {
    adobeEventName = `${adobeEventName}splitAction:notch`;
  } else if (a.classList.contains('underlay')) {
    adobeEventName = `${adobeEventName}splitAction:background`;
  } else if (a.parentElement.classList.contains('floating-button')) {
    adobeEventName = `${adobeEventName}floatingButton:ctaPressed`;
  } else if (a.closest('.faq')) {
    adobeEventName = appendLinkText(`${adobeEventName}faq:`, a);
    // CTA in the hero
  } else if (a.closest('.hero')) {
    adobeEventName = appendLinkText(`${adobeEventName}hero:`, a);
    // Click in the pricing block
  } else if (sparkLandingPageType === 'express-your-fandom') {
    adobeEventName = appendLinkText(`${adobeEventName}${sparkLandingPageType}:`, a);
  } else if (sparkLandingPageType === 'express-your-brand') {
    adobeEventName = appendLinkText(`${adobeEventName}learn:${sparkLandingPageType}:`, a);
  } else if (sparkLandingPageType === 'pricing') {
    // edu link
    if (a.pathname.includes('/edu')) {
      adobeEventName += 'pricing:education:Click';
      // business enterprise link
    } else if (a.pathname.includes('business/enterprise')) {
      adobeEventName += 'pricing:enterprise:Click';
      // Creative cloud learn more
    } else if (a.parentElement.id === 'adobe-spark-is-a-part-of-most-creative-cloud-paid-plans-learn-more') {
      adobeEventName += 'pricing:creativeCloud:learnMore';
    } else if (a.id === 'free-trial') {
      adobeEventName += 'pricing:cta:StartForFree';
    } else if (a.id === '3-month-trial') {
      adobeEventName += 'pricing:cta:StartYour3MonthTrial';
      // View plans
    } else {
      adobeEventName = 'adobe.com:express:CTA:pricing:viewPlans:Click';
    }
    // quick actions clicks
  } else if (a.closest('ccl-quick-action') && a.classList.contains('upload-your-photo')) {
    // this event is handled at mock-file-input level
    return;
  } else if (a.href && (a.href.match(/spark\.adobe\.com\/[a-zA-Z-]*\/?tools/g) || a.href.match(/express\.adobe\.com\/[a-zA-Z-]*\/?tools/g))) {
    adobeEventName = appendLinkText(adobeEventName, a);
  } else if (a.href && (a.href.match(/spark\.adobe\.com\/[a-zA-Z-]*\/?tools/g) || a.href.match(/express\.adobe\.com\/[a-zA-Z-]*\/?express-apps\/animate-from-audio/g))) {
    adobeEventName = appendLinkText(adobeEventName, a);
    // Frictionless Quick Actions clicks
  } else if (a.closest('ccl-quick-action') && (a.getAttribute('data-action') === 'Download')) {
    adobeEventName = 'quickAction:downloadPressed';
  } else if (a.closest('ccl-quick-action') && (a.getAttribute('data-action') === 'Editor')) {
    adobeEventName = 'quickAction:openInEditorPressed';
    // ToC clicks
  } else if (a.closest('.toc-container')) {
    if (a.classList.contains('toc-toggle')) {
      adobeEventName += 'toc:toggle:Click';
    } else if (a.classList.contains('toc-close')) {
      adobeEventName += 'toc:close:Click';
    } else if (a.classList.contains('toc-handle')) {
      adobeEventName += 'toc:close:Click:handle';
    } else if (a.classList.contains('toc-wrapper')) {
      adobeEventName += 'toc:close:Click:background';
    } else {
      adobeEventName = appendLinkText(`${adobeEventName}toc:link:Click:`, a);
    }
  } else if (a.closest('.template')) {
    adobeEventName = appendLinkText(adobeEventName, a);
  } else if (a.closest('.tabs-ax .tab-list-container')) {
    adobeEventName += `${a.closest('.tabs-ax')?.id}:${a.id}`;
    // Default clicks
  } else {
    adobeEventName = appendLinkText(adobeEventName, a);
  }

  // clicks using [data-lh and data-ll]
  let trackingHeader = a.closest('[data-lh]');
  if (trackingHeader || a.dataset.lh) {
    adobeEventName = 'adobe.com:express';
    let headerString = '';
    while (trackingHeader) {
      headerString = `:${textToName(trackingHeader.dataset.lh.trim())}${headerString}`;
      trackingHeader = trackingHeader.parentNode.closest('[data-lh]');
    }
    adobeEventName += headerString;
    if (a.dataset.ll) {
      adobeEventName += `:${textToName(a.dataset.ll.trim())}`;
    } else {
      adobeEventName += `:${textToName(a.innerText.trim())}`;
    }
  }
  if (window.hlx?.experiment) {
    let prefix = '';
    if (window.hlx.experiment?.id) prefix = `${window.hlx.experiment.id}:`;
    if (window.hlx.experiment?.selectedVariant) {
      let variant = window.hlx.experiment.selectedVariant;
      if (variant.includes('-')) [, variant] = variant.split('-');
      prefix += `${variant}:`;
    }
    adobeEventName = prefix + adobeEventName;
  }

  _satellite.track('event', {
    xdm: {},
    data: {
      eventType: 'web.webinteraction.linkClicks',
      web: {
        webInteraction: {
          name: adobeEventName,
          linkClicks: {
            value: 1,
          },
          type: 'other',
        },
      },
      _adobe_corpnew: {
        digitalData: {
          primaryEvent: {
            eventInfo: {
              eventName: adobeEventName,
            },
          },
          ...(hemingwayAsset
            ? {
              asset: {
                assetInfo: {
                  assetId: hemingwayAssetId,
                  assetPath: hemingwayAssetPath,
                  assetPosition: hemingwayAssetPosition,
                },
              },
            }
            : {}),
        },
      },
    },
  });
}

function trackVideoAnalytics(parameters) {
  const {
    videoName,
    videoId,
    videoLength,
    product,
    videoCategory,
    videoDescription,
    videoPlayer,
    videoMediaType,
  } = parameters;

  set('video.videoInfo.videoName', videoName);
  set('video.videoInfo.videoId', videoId);
  set('video.videoInfo.videoLength', videoLength);
  set('video.videoInfo.product', product);
  set('video.videoInfo.videoCategory', videoCategory);
  set('video.videoInfo.videoDescription', videoDescription);
  set('video.videoInfo.videoPlayer', videoPlayer);
  set('video.videoInfo.videoMediaType', videoMediaType);
}

function decorateAnalyticsEvents() {
  // for tracking all of the links
  d.addEventListener('click', (event) => {
    if (event.target.tagName === 'A' || event.target.dataset.ll?.length) {
      trackButtonClick(event.target);
    }
  });

  // for tracking split action block notch and underlay background
  d.addEventListener('splitactionloaded', () => {
    const $notch = d.querySelector('main .split-action-container .notch');
    const $underlay = d.querySelector('main .split-action-container .underlay');

    if ($notch) {
      $notch.addEventListener('click', () => {
        trackButtonClick($notch);
      });
    }

    if ($underlay) {
      $underlay.addEventListener('click', () => {
        trackButtonClick($underlay);
      });
    }
  });

  // Tracking any link or links that is added after page loaded.
  d.addEventListener('linkspopulated', async (e) => {
    await trackBranchParameters(e.detail);
    e.detail.forEach(($link) => {
      $link.addEventListener('click', () => {
        trackButtonClick($link);
      });
    });
  });

  d.addEventListener('pricingdropdown', () => {
    sendEventToAdobeAnaltics('adobe.com:express:pricing:bundleType:selected');
  });

  // tracking videos loaded asynchronously.
  d.addEventListener('videoloaded', (e) => {
    trackVideoAnalytics(e.detail.parameters);
    _satellite.track('videoloaded');
  });

  d.addEventListener('videoclosed', (e) => {
    sendEventToAdobeAnaltics(`adobe.com:express:cta:learn:columns:${e.detail.parameters.videoId}:videoClosed`);
  });

  d.addEventListener('click', (e) => {
    if (e.target.id === 'mock-file-input') {
      sendEventToAdobeAnaltics('adobe.com:express:cta:uploadYourPhoto');
    }
  });

  // track non-click interactions
  // BlockMediator triggered
  import('./block-mediator.min.js').then((resp) => {
    const { default: BlockMediator } = resp;
    BlockMediator.subscribe('billing-plan', ({ newValue }) => {
      sendEventToAdobeAnaltics(`adobe.com:express:cta:pricing:toggle:${newValue}`);
    });
  });

  if (['yes', 'true', 'on'].includes(getMetadata('mobile-benchmark').toLowerCase()) && document.body.dataset.device === 'mobile') {
    import('./block-mediator.min.js').then((resp) => {
      const { default: BlockMediator } = resp;
      const eligibility = BlockMediator.get('mobileBetaEligibility');
      if (eligibility) {
        sendEventToAdobeAnaltics(`betaEligibility:${eligibility.deviceSupport}`);
      } else {
        const unsub = BlockMediator.subscribe('mobileBetaEligibility', (e) => {
          sendEventToAdobeAnaltics(`betaEligibility:${e.newValue.deviceSupport}`);
          unsub();
        });
      }
    });
  }
}

function martechLoadedCB() {
  /* eslint-disable no-underscore-dangle */
  //------------------------------------------------------------------------------------
  // gathering the data
  //------------------------------------------------------------------------------------

  const locale = getConfig().locale.prefix;
  const pathSegments = pathname.substr(1).split('/');
  if (locale !== '') pathSegments.shift();
  const pageName = `adobe.com:${pathSegments.join(':')}`;

  const language = document.documentElement.getAttribute('lang');

  let category = getMetadata('category');
  if (!category && (pathname.includes('/create/')
      || pathname.includes('/feature/'))) {
    category = 'design';
    if (pathname.includes('/image')) category = 'photo';
    if (pathname.includes('/video')) category = 'video';
  }

  // home
  if (
    pathname === '/express'
      || pathname === '/express/'
  ) {
    sparkLandingPageType = 'home';
    // seo
  } else if (
    pathname === '/express/create'
      || pathname.includes('/create/')
      || pathname === '/express/make'
      || pathname.includes('/make/')
      || pathname === '/express/feature'
      || pathname.includes('/feature/')
      || pathname === '/express/discover'
      || pathname.includes('/discover/')
  ) {
    sparkLandingPageType = 'seo';
    // learn
  } else if (
    pathname === '/express/tools'
      || pathname.includes('/tools/')
  ) {
    sparkLandingPageType = 'quickAction';
  } else if (
    pathname === '/express/learn'
      || (
        pathname.includes('/learn/')
        && !pathname.includes('/blog/')
      )
  ) {
    if (pathname.includes('/express-your-brand')) {
      sparkLandingPageType = 'express-your-brand';
    } else {
      sparkLandingPageType = 'learn';
    }
    // blog
  } else if (
    pathname === '/express/learn/blog'
      || pathname.includes('/learn/blog/')
  ) {
    sparkLandingPageType = 'blog';
    // pricing
  } else if (
    pathname.includes('/pricing')
  ) {
    sparkLandingPageType = 'pricing';
    // edu
  } else if (
    pathname.includes('/education/')
  ) {
    sparkLandingPageType = 'edu';
    // other
  } else if (
    pathname.includes('/express-your-fandom')
  ) {
    sparkLandingPageType = 'express-your-fandom';
  } else {
    sparkLandingPageType = 'other';
  }
  const url = new URL(loc.href);
  const sparkTouchpoint = url.searchParams.get('touchpointName');

  //----------------------------------------------------------------------------
  // set some global and persistent data layer properties
  //----------------------------------------------------------------------------
  set('page.pageInfo.pageName', pageName);
  set('page.pageInfo.language', language);
  set('page.pageInfo.siteSection', 'adobe.com:express');
  set('page.pageInfo.category', category);

  //----------------------------------------------------------------------------
  // spark specific global and persistent data layer properties
  //----------------------------------------------------------------------------
  set('page.pageInfo.pageurl', loc.href);
  set('page.pageInfo.namespace', 'express');

  /* set experiment and variant information */
  if (window.hlx.experiment) {
    const { experiment } = window.hlx;
    set('adobe.experienceCloud.target.info.primarytest.testinfo.campaignid', experiment.id);
    set('adobe.experienceCloud.target.info.primarytest.testinfo.offerid', experiment.selectedVariant);
  }

  //------------------------------------------------------------------------------------
  // Fire extra spark events
  //------------------------------------------------------------------------------------

  // Fire the viewedPage event
  sendEventToAdobeAnaltics('viewedPage');

  // Fire the landing:viewedPage event
  sendEventToAdobeAnaltics('landing:viewedPage');

  // Fire the displayPurchasePanel event if it is the pricing site
  if (
    sparkLandingPageType === 'pricing'
      && sparkTouchpoint
  ) {
    sendEventToAdobeAnaltics('displayPurchasePanel');
  }

  const processed = {};
  function initHemingway() {
    // poll the dataLayer every 2 seconds
    setInterval(() => {
      // loop through each of the events in the dataLayer
      window?.dataLayer?.forEach((evt) => {
        // don't continue if it has already been processed
        if (processed[evt.assetId]) {
          return;
        }
        // mark as processed
        processed[evt.assetId] = 1;
        // track a new event
        _satellite.track('event', {
          data: {
            eventType: 'web.webinteraction.linkClicks',
            web: {
              webInteraction: {
                name: 'assetView',
                linkClicks: {
                  value: 1,
                },
                type: 'other',
              },
            },
            _adobe_corpnew: {
              digitalData: {
                primaryEvent: {
                  eventInfo: {
                    eventName: 'assetView',
                  },
                },
                asset: {
                  assetInfo: {
                    assetId: evt.assetId,
                    assetPath: evt.assetPath,
                  },
                },
              },
            },
          },
        });
      });
    }, 2000);
  }

  decorateAnalyticsEvents();
  initHemingway();

  const ENABLE_PRICING_MODAL_AUDIENCE = 'enablePricingModal';
  const RETURNING_VISITOR_SEGMENT_ID = 23153796;

  const QUICK_ACTION_SEGMENTS = [
    [24241150, 'enableRemoveBackgroundRating'],
    [24793469, 'enableConvertToGifRating'],
    [24793470, 'enableConvertToJpgRating'],
    [24793471, 'enableConvertToMp4Rating'],
    [24793472, 'enableConvertToPngRating'],
    [24793473, 'enableConvertToSvgRating'],
    [24793474, 'enableCropImageRating'],
    [24793475, 'enableCropVideoRating'],
    [24793476, 'enableLogoMakerRating'],
    [24793477, 'enableMergeVideoRating'],
    [24793478, 'enableQrGeneratorRating'],
    [24793479, 'enableResizeImageRating'],
    [24793480, 'enableChangeSpeedRating'],
    [24793481, 'enableTrimVideoRating'],
    [24793483, 'enableResizeVideoRating'],
    [24793488, 'enableReverseVideoRating'],
  ];

  async function getAudiences() {
    const getSegments = async (ecid) => {
      const { default: BlockMediator } = await import('./block-mediator.min.js');

      BlockMediator.set('audiences', []);
      BlockMediator.set('segments', []);
      if (!ecid) return;
      w.setAudienceManagerSegments = (json) => {
        if (json && json.segments && json.segments.includes(RETURNING_VISITOR_SEGMENT_ID)) {
          const audiences = BlockMediator.get('audiences');
          const segments = BlockMediator.get('segments');
          audiences.push(ENABLE_PRICING_MODAL_AUDIENCE);
          segments.push(RETURNING_VISITOR_SEGMENT_ID);

          sendEventToAdobeAnaltics('pricingModalUserInSegment');
        }

        QUICK_ACTION_SEGMENTS.forEach((QUICK_ACTION_SEGMENT) => {
          if (json && json.segments && json.segments.includes(QUICK_ACTION_SEGMENT[0])) {
            const audiences = BlockMediator.get('audiences');
            const segments = BlockMediator.get('segments');
            audiences.push(QUICK_ACTION_SEGMENT[1]);
            segments.push(QUICK_ACTION_SEGMENT[0]);
          }
        });

        document.dispatchEvent(new Event('context_loaded'));
      };
      // TODO: What the heck is this?  This needs to be behind one trust and cmp
      loadScript(`https://adobe.demdex.net/event?d_dst=1&d_rtbd=json&d_cb=setAudienceManagerSegments&d_cts=2&d_mid=${ecid}`);
    };

    await _satellite.alloyConfigurePromise;
    const data = await alloy('getIdentity');
    getSegments(data?.identity?.ECID || null);
  }

  __satelliteLoadedCallback(getAudiences);
}

export default async function initMartech() {
  await loadScript(martechURL);
  return martechLoadedCB();
}
