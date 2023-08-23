/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import {
  addPublishDependencies,
  createTag,
  // eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';
import { getOffer, buildUrl } from '../../scripts/utils/pricing.js';

import { buildCarousel } from '../shared/carousel.js';

function pushPricingAnalytics(adobeEventName, sparkEventName, plan) {
  const url = new URL(window.location.href);
  const sparkTouchpoint = url.searchParams.get('touchpointName');

  /* eslint-disable no-underscore-dangle */
  /* global digitalData _satellite */
  digitalData._set('primaryEvent.eventInfo.eventName', adobeEventName);
  digitalData._set('spark.eventData.eventName', sparkEventName);
  digitalData._set('spark.eventData.contextualData4', `billingFrequency:${plan.frequency}`);
  digitalData._set('spark.eventData.contextualData6', `commitmentType:${plan.frequency}`);
  digitalData._set('spark.eventData.contextualData7', `currencyCode:${plan.currency}`);
  digitalData._set('spark.eventData.contextualData9', `offerId:${plan.offerId}`);
  digitalData._set('spark.eventData.contextualData10', `price:${plan.price}`);
  digitalData._set('spark.eventData.contextualData12', `productName:${plan.name} - ${plan.frequency}`);
  digitalData._set('spark.eventData.contextualData14', 'quantity:1');
  digitalData._set('spark.eventData.trigger', sparkTouchpoint);

  _satellite.track('event', {
    digitalData: digitalData._snapshot(),
  });

  digitalData._delete('primaryEvent.eventInfo.eventName');
  digitalData._delete('spark.eventData.eventName');
  digitalData._delete('spark.eventData.contextualData4');
  digitalData._delete('spark.eventData.contextualData6');
  digitalData._delete('spark.eventData.contextualData7');
  digitalData._delete('spark.eventData.contextualData9');
  digitalData._delete('spark.eventData.contextualData10');
  digitalData._delete('spark.eventData.contextualData12');
  digitalData._delete('spark.eventData.contextualData14');
}

async function fetchPlan(planUrl) {
  if (!window.pricingPlans) {
    window.pricingPlans = {};
  }

  let plan = window.pricingPlans[planUrl];

  if (!plan) {
    plan = {};
    const link = new URL(planUrl);
    const params = link.searchParams;

    plan.url = planUrl;
    plan.country = 'us';
    plan.language = 'en';
    plan.price = '9.99';
    plan.currency = 'US';
    plan.symbol = '$';

    // TODO: Remove '/sp/ once confirmed with stakeholders
    const allowedHosts = ['new.express.adobe.com', 'express.adobe.com', 'adobesparkpost.app.link'];
    const { host } = new URL(planUrl);
    if (allowedHosts.includes(host) || planUrl.includes('/sp/')) {
      plan.offerId = 'FREE0';
      plan.frequency = 'monthly';
      plan.name = 'Free';
      plan.stringId = 'free-trial';
    } else {
      plan.offerId = params.get('items[0][id]');
      plan.frequency = null;
      plan.name = 'Premium';
      plan.stringId = '3-month-trial';
    }

    if (plan.offerId === '70C6FDFC57461D5E449597CC8F327CF1' || plan.offerId === 'CFB1B7F391F77D02FE858C43C4A5C64F') {
      plan.frequency = 'Monthly';
    } else if (plan.offerId === 'E963185C442F0C5EEB3AE4F4AAB52C24' || plan.offerId === 'BADDACAB87D148A48539B303F3C5FA92') {
      plan.frequency = 'Annual';
    } else {
      plan.frequency = null;
    }

    const countryOverride = new URLSearchParams(window.location.search).get('country');
    const offer = await getOffer(plan.offerId, countryOverride);

    if (offer) {
      plan.currency = offer.currency;
      plan.price = offer.unitPrice;
      plan.formatted = `${offer.unitPriceCurrencyFormatted}`;
      plan.country = offer.country;
      plan.vatInfo = offer.vatInfo;
      plan.language = offer.lang;
      plan.rawPrice = offer.unitPriceCurrencyFormatted.match(/[\d\s,.+]+/g);
      plan.prefix = offer.prefix ?? '';
      plan.suffix = offer.suffix ?? '';
      plan.formatted = plan.formatted.replace(plan.rawPrice[0], `<strong>${plan.prefix}${plan.rawPrice[0]}${plan.suffix}</strong>`);
    }

    window.pricingPlans[planUrl] = plan;
  }

  return plan;
}

async function selectPlan($card, planUrl, sendAnalyticEvent) {
  const plan = await fetchPlan(planUrl);

  if (plan) {
    const $pricingCta = $card.querySelector('.puf-card-top a');
    const $pricingHeader = $card.querySelector('.puf-pricing-header');
    const $pricingVat = $card.querySelector('.puf-vat-info');

    $pricingHeader.innerHTML = plan.formatted;
    $pricingHeader.classList.add(plan.currency.toLowerCase());
    $pricingVat.textContent = plan.vatInfo;
    $pricingCta.href = buildUrl(plan.url, plan.country, plan.language);
    $pricingCta.dataset.planUrl = planUrl;
    $pricingCta.id = plan.stringId;
  }

  if (sendAnalyticEvent) {
    const adobeEventName = 'adobe.com:express:pricing:commitmentType:selected';
    const sparkEventName = 'pricing:commitmentTypeSelected';
    pushPricingAnalytics(adobeEventName, sparkEventName, plan);
  }
}

function displayPlans($card, plans) {
  const $planContainer = $card.querySelector('.puf-card-plans');
  const $switch = createTag('label', { class: 'puf-card-switch' });
  const $checkbox = createTag('input', { type: 'checkbox', class: 'puf-card-checkbox' });
  const $slider = createTag('span', { class: 'puf-card-slider' });
  const $defaultPlan = createTag('div', { class: 'strong' });
  const $secondPlan = createTag('div');

  $defaultPlan.innerHTML = plans[0].text.replace(plans[0].plan, `<span>${plans[0].plan}</span>`);
  $secondPlan.innerHTML = plans[1].text.replace(plans[1].plan, `<span>${plans[1].plan}</span>`);

  $planContainer.append($defaultPlan);
  $planContainer.append($switch);
  $switch.append($checkbox);
  $switch.append($slider);
  $planContainer.append($secondPlan);

  $checkbox.addEventListener('change', () => {
    if ($checkbox.checked) {
      $defaultPlan.classList.remove('strong');
      $secondPlan.classList.add('strong');
      selectPlan($card, plans[1].url, true);
    } else {
      $defaultPlan.classList.add('strong');
      $secondPlan.classList.remove('strong');
      selectPlan($card, plans[0].url, true);
    }
  });

  return $planContainer;
}

function buildPlans($plans) {
  const plans = [];

  $plans.forEach(($plan) => {
    const $planLink = $plan.querySelector('a');

    if ($planLink) {
      plans.push({
        url: $planLink.href,
        plan: $planLink.textContent.trim(),
        text: $plan.textContent.trim(),
      });
    }
  });

  return plans;
}

function decorateCard($block, cardClass) {
  const $cardContainer = createTag('div', { class: 'puf-card-container' });
  const $card = createTag('div', { class: `puf-card ${cardClass}` });
  const $cardBanner = $block.children[0].children[0];
  const $cardTop = $block.children[1].children[0];
  const $cardBottom = $block.children[2].children[0];
  const $cardHeader = $cardTop.querySelector('h3, p:first-of-type');
  const $cardHeaderSvg = $cardTop.querySelector('svg');
  const $cardPricingHeader = createTag('h2', { class: 'puf-pricing-header' });
  const $cardVat = createTag('div', { class: 'puf-vat-info' });
  const $cardPlansContainer = createTag('div', { class: 'puf-card-plans' });
  const $cardCta = createTag('a', { class: 'button large' });
  const $plans = $cardTop.querySelectorAll('li');
  const $listItems = $cardBottom.querySelectorAll('svg');
  const plans = buildPlans($plans);

  if (cardClass === 'puf-left') {
    $cardCta.classList.add('reverse', 'accent');
  }

  let formattedHeader = createTag('h3');
  if ($cardHeader?.tagName === 'P') {
    formattedHeader.textContent = $cardHeader.lastChild.data;
  } else if ($cardHeader?.tagName === 'H3') {
    formattedHeader = $cardHeader;
  }

  $cardBanner.classList.add('puf-card-banner');
  $cardTop.classList.add('puf-card-top');
  $cardBottom.classList.add('puf-card-bottom');

  $card.append($cardBanner);
  $card.append($cardTop);
  $card.append($cardBottom);

  $cardTop.prepend($cardCta);
  $cardTop.prepend($cardPlansContainer);
  $cardTop.prepend($cardVat);
  $cardTop.prepend($cardPricingHeader);
  $cardTop.prepend(formattedHeader);

  if (!$cardBanner.textContent.trim()) {
    $cardBanner.style.display = 'none';
  } else {
    $cardBanner.classList.add('recommended');
  }

  if ($cardHeaderSvg) formattedHeader.prepend($cardHeaderSvg);

  if (plans.length) {
    selectPlan($card, plans[0].url, false);

    if (plans.length > 1) {
      displayPlans($card, plans);
    }
  }

  $cardTop.querySelector('ul').remove();

  const $ctaTextContainer = $cardTop.querySelector('strong');
  if ($ctaTextContainer) {
    $cardCta.textContent = $ctaTextContainer.textContent.trim();
    $ctaTextContainer.parentNode.remove();
  } else {
    $cardCta.textContent = 'Start your trial';
  }

  $cardContainer.append($card);

  if ($listItems) {
    $listItems.forEach(($listItem) => {
      $listItem.parentNode.classList.add('puf-list-item');
    });
  }

  return $cardContainer;
}

function updatePUFCarousel($block) {
  const $carouselContainer = $block.querySelector('.carousel-container');
  const $carouselPlatform = $block.querySelector('.carousel-platform');
  let $leftCard = $block.querySelector('.puf-left');
  let $rightCard = $block.querySelector('.puf-right');
  let priceSet = $block.querySelector('.puf-pricing-header').textContent;
  $carouselContainer.classList.add('slide-1-selected');
  const slideFunctionality = () => {
    $carouselPlatform.scrollLeft = $carouselPlatform.offsetWidth;
    $carouselContainer.style.minHeight = `${$leftCard.clientHeight + 40}px`;
    const $rightArrow = $carouselContainer.querySelector('.carousel-fader-right');
    const $leftArrow = $carouselContainer.querySelector('.carousel-fader-left');
    const changeSlide = (index) => {
      if (index === 0) {
        $carouselContainer.classList.add('slide-1-selected');
        $carouselContainer.classList.remove('slide-2-selected');
        $carouselContainer.style.minHeight = `${$leftCard.clientHeight + 40}px`;
      } else {
        $carouselContainer.classList.remove('slide-1-selected');
        $carouselContainer.classList.add('slide-2-selected');
        $carouselContainer.style.minHeight = `${$rightCard.clientHeight + 110}px`;
      }
    };

    $leftArrow.addEventListener('click', () => changeSlide(0));
    $rightArrow.addEventListener('click', () => changeSlide(1));
    $block.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft') {
        changeSlide(0);
      } else if (e.key === 'ArrowRight') {
        changeSlide(1);
      }
    });
    let initialX = null;
    let initialY = null;
    const startTouch = (e) => {
      initialX = e.touches[0].clientX;
      initialY = e.touches[0].clientY;
    };
    const moveTouch = (e) => {
      if (initialX === null || initialY === null) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = initialX - currentX;
      const diffY = initialY - currentY;
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          changeSlide(1);
        } else {
          changeSlide(0);
        }
        e.preventDefault();
      }
      initialX = null;
      initialY = null;
    };
    $block.addEventListener('touchstart', startTouch, false);
    $block.addEventListener('touchmove', moveTouch, false);
    const mediaQuery = window.matchMedia('(min-width: 900px)');
    mediaQuery.onchange = () => {
      $carouselContainer.style.minHeight = `${$leftCard.clientHeight + 40}px`;
    };
  };

  const waitForCardsToLoad = setInterval(() => {
    if ($leftCard && $rightCard && priceSet) {
      clearInterval(waitForCardsToLoad);
      slideFunctionality();
    } else {
      $leftCard = $block.querySelector('.puf-left');
      $rightCard = $block.querySelector('.puf-right');
      priceSet = $block.querySelector('.puf-pricing-header').textContent;
    }
  }, 400);
}

function wrapTextAndSup($block) {
  const supTags = $block.getElementsByTagName('sup');
  Array.from(supTags).forEach((supTag) => {
    supTag.classList.add('puf-sup');
  });

  const $listItems = $block.querySelectorAll('.puf-list-item');
  $listItems.forEach(($listItem) => {
    const $childNodes = $listItem.childNodes;

    const filteredChildren = Array.from($childNodes).filter((node) => {
      const isSvg = node.tagName && node.tagName.toLowerCase() === 'svg';
      const isTextNode = node.nodeType === Node.TEXT_NODE;
      return !isSvg && (isTextNode || node.nodeType === Node.ELEMENT_NODE);
    });

    const filteredChildrenExceptFirstText = filteredChildren.slice(1);

    const $textAndSupWrapper = createTag('div', { class: 'puf-text-and-sup-wrapper' });
    $textAndSupWrapper.append(...filteredChildrenExceptFirstText);
    $listItem.append($textAndSupWrapper);
  });
}

function highlightText($block) {
  const $highlightRegex = /^\(\(.*\)\)$/;
  const $blockElements = Array.from($block.querySelectorAll('*'));

  if (!$blockElements.some(($element) => $highlightRegex.test($element.textContent))) {
    return;
  }

  const $highlightedElements = $blockElements
    .filter(($element) => $highlightRegex.test($element.textContent));

  $highlightedElements.forEach(($element) => {
    $element.classList.add('puf-highlighted-text');
    $element.textContent = $element.textContent.replace(/^\(\(/, '').replace(/\)\)$/, '');
  });
}

function alignP($block) {
  const isDesktop = window.innerWidth >= 900;

  if (isDesktop) {
    const card1 = $block.querySelector('.puf-card.puf-left > .puf-card-top > p:last-of-type');
    const card2 = $block.querySelector('.puf-card.puf-right > .puf-card-top > p:last-of-type');

    const adjustHeight = () => {
      if (card1 && card2) {
        card1.style.height = 'auto';
        card2.style.height = 'auto';

        const maxHeight = Math.max(
          card1.getBoundingClientRect().height,
          card2.getBoundingClientRect().height,
        );

        card1.style.height = `${maxHeight}px`;
        card2.style.height = `${maxHeight}px`;
      } else if (card1) {
        card1.style.height = 'auto';
      } else if (card2) {
        card2.style.height = 'auto';
      }
    };

    const ro = new ResizeObserver(() => adjustHeight());

    if (card1) {
      ro.observe(card1);
    }

    if (card2) {
      ro.observe(card2);
    }

    adjustHeight();
  }
}

function alignHighlights($block) {
  const isDesktop = window.innerWidth >= 900;

  if (isDesktop) {
    const cardLeft = $block.querySelector('.puf-card.puf-left > .puf-card-bottom > h3');
    const cardRight = $block.querySelector('.puf-card.puf-right > .puf-card-bottom > h3');

    const adjustHeight = () => {
      if (cardLeft && cardRight) {
        cardLeft.style.height = 'auto';
        cardRight.style.height = 'auto';

        const maxHeightTitle = Math.max(
          cardLeft.getBoundingClientRect().height,
          cardRight.getBoundingClientRect().height,
        );

        cardLeft.style.height = `${maxHeightTitle}px`;
        cardRight.style.height = `${maxHeightTitle}px`;
      } else if (cardLeft) {
        cardLeft.style.height = 'auto';
      } else if (cardRight) {
        cardRight.style.height = 'auto';
      }
    };

    const ro = new ResizeObserver(() => adjustHeight());

    if (cardLeft) {
      ro.observe(cardLeft);
    }

    if (cardRight) {
      ro.observe(cardRight);
    }

    adjustHeight();
  }
}

function decorateFooter($block) {
  if ($block?.children?.[3]) {
    const $footer = createTag('div', { class: 'puf-pricing-footer' });
    $footer.append($block.children[3]);
    return $footer;
  } else {
    return '';
  }
}

export default function decorate($block) {
  const $leftCard = decorateCard($block, 'puf-left');
  const $rightCard = decorateCard($block, 'puf-right');
  const $footer = decorateFooter($block);

  $block.innerHTML = '';
  $block.append($leftCard, $rightCard);

  buildCarousel('.puf-card-container', $block);
  updatePUFCarousel($block);
  addPublishDependencies('/express/system/offers-new.json');
  wrapTextAndSup($block);
  $block.append($footer);
  alignP($block);
  highlightText($block);
  alignHighlights($block);
}
