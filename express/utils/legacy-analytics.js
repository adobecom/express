/* global */

import {
  sendEventToAdobeAnaltics,
  textToName,
  appendLinkText,
  trackButtonClick,
  trackBranchParameters,
} from './instrument.js';

// this saves on file size when this file gets minified...
const d = document;
let sparkLandingPageType;

// Frictionless Quick Actions tracking events

function handleQuickActionEvents(el) {
  let frictionLessQuctionActionsTrackingEnabled = false;
  sendEventToAdobeAnaltics('quickAction:uploadPageViewed');
  el[0].addEventListener('ccl-quick-action-complete', () => {
    if (frictionLessQuctionActionsTrackingEnabled) {
      return;
    }
    sendEventToAdobeAnaltics('quickAction:assetUploaded');
    sendEventToAdobeAnaltics('project:editorDisplayed');
    const $links = d.querySelectorAll('ccl-quick-action a');
    // for tracking all of the links
    $links.forEach(($a) => {
      $a.addEventListener('click', () => {
        trackButtonClick($a);
      });
    });
    frictionLessQuctionActionsTrackingEnabled = true;
  });
}

const cclQuickAction = d.getElementsByTagName('ccl-quick-action');
if (cclQuickAction.length) {
  handleQuickActionEvents(cclQuickAction);
} else {
  d.addEventListener('ccl-quick-action-rendered', (e) => {
    if (e.target.tagName === 'CCL-QUICK-ACTION') {
      handleQuickActionEvents(d.getElementsByTagName('ccl-quick-action'));
    }
  });
}

export default async function decorateTrackingEvents() {
  const $links = d.querySelectorAll('main a');

  // for adding branch parameters to branch links
  await trackBranchParameters($links);

  // for tracking the faq
  d.querySelectorAll('main .faq-accordion').forEach(($a) => {
    $a.addEventListener('click', () => {
      trackButtonClick($a);
    });
  });

  // for tracking the content toggle buttons
  d.querySelectorAll('main .content-toggle button').forEach(($button) => {
    $button.addEventListener('click', () => {
      trackButtonClick($button);
    });
  });

  // for tracking the choose your path links
  d.querySelectorAll('main .choose-your-path div.choose-your-path-slide').forEach(($slide) => {
    $slide.addEventListener('click', () => {
      trackButtonClick($slide);
    });
  });

  // for tracking just the sticky banner close button
  const $button = d.querySelector('.sticky-promo-bar button.close');
  if ($button) {
    $button.addEventListener('click', () => {
      sendEventToAdobeAnaltics('adobe.com:express:cta:startYourFreeTrial:close');
    });
  }

  // for tracking just the commitment type dropdown on the pricing block
  const $pricingDropdown = d.querySelector('.pricing-plan-dropdown');
  if ($pricingDropdown) {
    $pricingDropdown.addEventListener('change', () => {
      sendEventToAdobeAnaltics('adobe.com:express:pricing:commitmentType:selected');
    });
  }

  // Tracking any video column blocks.
  const $columnVideos = d.querySelectorAll('.column-video');
  if ($columnVideos.length) {
    $columnVideos.forEach(($columnVideo) => {
      const $parent = $columnVideo.closest('.columns');
      const $a = $parent.querySelector('a');
      const adobeEventName = appendLinkText(`adobe.com:express:cta:learn:columns:${sparkLandingPageType}:`, $a);

      $parent.addEventListener('click', (e) => {
        e.stopPropagation();
        sendEventToAdobeAnaltics(adobeEventName);
      });
    });
  }

  const toggleBar = d.querySelector('.toggle-bar.block');
  if (toggleBar) {
    const tgBtns = toggleBar.querySelectorAll('button.toggle-bar-button');

    tgBtns.forEach((btn) => {
      const textEl = btn.querySelector('.text-wrapper');
      let texts = [];

      if (textEl) {
        let child = textEl.firstChild;
        while (child) {
          if (child.nodeType === 3) {
            texts.push(child.data);
          }
          child = child.nextSibling;
        }
      }

      texts = texts.join('') || textEl.textContent.trim();
      const eventName = `adobe.com:express:homepage:intentToggle:${textToName(texts)}`;
      btn.addEventListener('click', () => {
        sendEventToAdobeAnaltics(eventName);
      });
    });
  }

  // for tracking the tab-ax tabs
  d.querySelectorAll('main .tabs-ax .tab-list-container button[role="tab"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      trackButtonClick(btn);
    });
  });

  d.querySelectorAll('main .pricing-table .toggle-content').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const buttonEl = toggle.querySelector('span[role="button"]');
      const action = buttonEl && buttonEl.getAttribute('aria-expanded') === 'true' ? 'closed' : 'opened';
      sendEventToAdobeAnaltics(`adobe.com:express:cta:pricing:tableToggle:${action || ''}`);
    });
  });
}
