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
import { addPublishDependencies, createTag } from '../../scripts/scripts.js';
import { fetchPlan, buildUrl } from '../../scripts/utils/pricing.js';
import { buildCarousel } from '../shared/carousel.js';

let invisContainer;
let parent;

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

async function selectPlan(card, planUrl, sendAnalyticEvent) {
  const plan = await fetchPlan(planUrl);

  if (plan) {
    const pricingCta = card.querySelector('.puf-card-top a');
    const pricingHeader = card.querySelector('.puf-pricing-header');
    const pricingSuf = card.querySelector('.puf-pricing-suf');
    const pricingVat = card.querySelector('.puf-vat-info');
    const pricingBase = card.querySelector('.puf-bp-header');

    if (pricingHeader) {
      pricingHeader.innerHTML = plan.formatted || '';
      pricingHeader.classList.add(plan.currency.toLowerCase());
    }

    if (pricingBase) {
      pricingBase.innerHTML = plan.formattedBP || '';
    }

    if (pricingSuf) pricingSuf.textContent = plan.suffix || '';
    if (pricingVat) pricingVat.textContent = plan.vatInfo || '';

    if (pricingCta) {
      pricingCta.href = buildUrl(plan.url, plan.country, plan.language);
      pricingCta.dataset.planUrl = planUrl;
      pricingCta.id = plan.stringId;
    }
  }

  if (sendAnalyticEvent) {
    const adobeEventName = 'adobe.com:express:pricing:commitmentType:selected';
    const sparkEventName = 'pricing:commitmentTypeSelected';
    pushPricingAnalytics(adobeEventName, sparkEventName, plan);
  }
}

function displayPlans(card, plans) {
  const planContainer = card.querySelector('.puf-card-plans');
  const cardSwitch = createTag('label', { class: 'puf-card-switch' });
  const checkbox = createTag('input', { type: 'checkbox', class: 'puf-card-checkbox' });
  const slider = createTag('span', { class: 'puf-card-slider' });
  const defaultPlan = createTag('div', { class: 'strong' });
  const secondPlan = createTag('div');

  defaultPlan.innerHTML = plans[0].text.replace(plans[0].plan, `<span>${plans[0].plan}</span>`);
  secondPlan.innerHTML = plans[1].text.replace(plans[1].plan, `<span>${plans[1].plan}</span>`);

  planContainer.append(defaultPlan);
  planContainer.append(cardSwitch);
  cardSwitch.append(checkbox);
  cardSwitch.append(slider);
  planContainer.append(secondPlan);

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      defaultPlan.classList.remove('strong');
      secondPlan.classList.add('strong');
      selectPlan(card, plans[1].url, true);
    } else {
      defaultPlan.classList.add('strong');
      secondPlan.classList.remove('strong');
      selectPlan(card, plans[0].url, true);
    }
  });

  return planContainer;
}

function buildPlans(plansElement) {
  const plans = [];

  plansElement.forEach((plan) => {
    const planLink = plan.querySelector('a');

    if (planLink) {
      plans.push({
        url: planLink.href,
        plan: planLink.textContent.trim(),
        text: plan.textContent.trim(),
      });
    }
  });

  return plans;
}

async function decorateCard(block, cardClass = '') {
  const cardClassName = `puf-card ${cardClass}`.trim();
  const cardContainer = createTag('div', { class: 'puf-card-container' });
  const card = createTag('div', { class: cardClassName });
  const cardBanner = block.children[0].children[0];
  const cardTop = block.children[1].children[0];
  const cardBottom = block.children[2].children[0];
  const cardHeader = cardTop.querySelector('h3, p:first-of-type');
  const cardHeaderSvg = cardTop.querySelector('svg');
  const cardPricingContainer = createTag('div', { class: 'puf-pricing-container' });
  const cardBasePriceHeader = createTag('h2', { class: 'puf-bp-header' });
  const cardPricingHeader = createTag('h2', { class: 'puf-pricing-header' });
  const cardPricingSufContainer = createTag('div', { class: 'puf-pricing-suf-container' });
  const cardPricingSuf = createTag('div', { class: 'puf-pricing-suf' });
  const cardVat = createTag('div', { class: 'puf-vat-info' });
  const cardAdditionalContext = createTag('div', { class: 'puf-pricing-context' });
  const cardPlansContainer = createTag('div', { class: 'puf-card-plans' });
  const cardCta = createTag('a', { class: 'button large' });
  const plansElement = cardTop.querySelectorAll('li');
  const listItems = cardBottom.querySelectorAll('svg');
  const plans = buildPlans(plansElement);

  if (cardClass === 'puf-left') {
    cardCta.classList.add('reverse', 'accent');
  }

  let formattedHeader = createTag('h3');
  if (cardHeader?.tagName === 'P') {
    formattedHeader.textContent = cardHeader.lastChild.data;
  } else if (cardHeader?.tagName === 'H3') {
    formattedHeader = cardHeader;
  }

  cardBanner.classList.add('puf-card-banner');
  cardTop.classList.add('puf-card-top');
  cardBottom.classList.add('puf-card-bottom');

  cardPricingContainer.append(cardBasePriceHeader, cardPricingHeader, cardPricingSufContainer);
  cardPricingSufContainer.append(cardPricingSuf, cardVat);
  cardTop.prepend(
    cardHeader,
    cardPricingContainer,
    cardAdditionalContext,
    cardPlansContainer,
    cardCta,
  );
  card.append(cardBanner, cardTop, cardBottom);

  if (!cardBanner.textContent.trim()) {
    cardBanner.style.display = 'none';
  } else {
    cardBanner.classList.add('recommended');
  }

  if (cardHeaderSvg) formattedHeader.prepend(cardHeaderSvg);

  const ctaTextContainer = cardTop.querySelector('strong');
  if (ctaTextContainer) {
    cardCta.textContent = ctaTextContainer.textContent.trim();
    ctaTextContainer.parentNode.remove();
  } else {
    cardCta.textContent = 'Start your trial';
  }

  if (plans.length) {
    await selectPlan(card, plans[0].url, false);

    if (plans.length > 1) {
      displayPlans(card, plans);
    }
  }

  cardTop.querySelector('ul')?.remove();

  const pricingContextContainer = cardTop.querySelector('em');
  if (pricingContextContainer) {
    cardAdditionalContext.textContent = pricingContextContainer.textContent.trim();
    pricingContextContainer.parentNode.remove();
  } else {
    cardAdditionalContext.remove();
  }

  cardContainer.append(card);

  if (listItems) {
    listItems.forEach((listItem) => {
      listItem.parentNode.classList.add('puf-list-item');
    });
  }

  return cardContainer;
}

function updatePUFCarousel(block) {
  const carouselContainer = block.querySelector('.carousel-container');
  const carouselPlatform = block.querySelector('.carousel-platform');
  const leftCard = block.querySelector('.puf-left');
  const rightCard = block.querySelector('.puf-right');
  carouselContainer.classList.add('slide-1-selected');

  const slideFunctionality = () => {
    carouselPlatform.scrollLeft = carouselPlatform.offsetWidth;
    carouselContainer.style.width = '100%';
    carouselContainer.style.minHeight = `${leftCard.clientHeight + 40}px`;
    const rightArrow = carouselContainer.querySelector('.carousel-fader-right');
    const leftArrow = carouselContainer.querySelector('.carousel-fader-left');
    const changeSlide = (index) => {
      if (index === 0) {
        carouselContainer.classList.add('slide-1-selected');
        carouselContainer.classList.remove('slide-2-selected');
        carouselContainer.style.minHeight = `${leftCard.clientHeight + 40}px`;
      } else {
        carouselContainer.classList.remove('slide-1-selected');
        carouselContainer.classList.add('slide-2-selected');
        carouselContainer.style.minHeight = `${rightCard.clientHeight + 110}px`;
      }
    };

    leftArrow.addEventListener('click', () => changeSlide(0));
    rightArrow.addEventListener('click', () => changeSlide(1));
    block.addEventListener('keyup', (e) => {
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
    block.addEventListener('touchstart', startTouch, false);
    block.addEventListener('touchmove', moveTouch, false);
    const mediaQuery = window.matchMedia('(min-width: 900px)');
    mediaQuery.onchange = () => {
      carouselContainer.style.minHeight = `${leftCard.clientHeight + 40}px`;
    };
    const cardContainers = block.querySelectorAll('.puf-card-container');
    cardContainers.forEach((c) => {
      c.style.transition = 'left 0.5s';
    });
    parent.append(block);
    invisContainer.remove();
  };
  slideFunctionality();
}

function wrapTextAndSup(block) {
  const supTags = block.getElementsByTagName('sup');
  Array.from(supTags).forEach((supTag) => {
    supTag.classList.add('puf-sup');
  });

  const listItems = block.querySelectorAll('.puf-list-item');
  listItems.forEach((listItem) => {
    const { childNodes } = listItem;

    const filteredChildren = Array.from(childNodes).filter((node) => {
      const isSvg = node.tagName && node.tagName.toLowerCase() === 'svg';
      const isTextNode = node.nodeType === Node.TEXT_NODE;
      return !isSvg && (isTextNode || node.nodeType === Node.ELEMENT_NODE);
    });

    const filteredChildrenExceptFirstText = filteredChildren.slice(1);

    const textAndSupWrapper = createTag('div', { class: 'puf-text-and-sup-wrapper' });
    textAndSupWrapper.append(...filteredChildrenExceptFirstText);
    listItem.append(textAndSupWrapper);
  });
}

function formatTextElements(block) {
  const highlightRegex = /^\(\(.*\)\)$/;
  const dividerRegex = /^--.*--$/;
  const blockElements = Array.from(block.querySelectorAll('*'));

  if (!blockElements.some((element) => highlightRegex.test(element.textContent)
    || dividerRegex.test(element.textContent))) {
    return;
  }

  const highlightedElements = blockElements
    .filter((element) => highlightRegex.test(element.textContent));

  highlightedElements.forEach((element) => {
    element.classList.add('puf-highlighted-text');
    element.textContent = element.textContent.replace(/^\(\(/, '').replace(/\)\)$/, '');
  });

  const dividerElements = blockElements
    .filter((element) => dividerRegex.test(element.textContent));

  dividerElements.forEach((element) => {
    element.classList.add('puf-divider-text');
    element.textContent = element.textContent.replace(/^--/, '').replace(/--$/, '');
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

function decorateFooter(block) {
  if (block?.children?.[3]) {
    const footer = createTag('div', { class: 'puf-pricing-footer' });
    footer.append(block.children[3]);
    return footer;
  } else {
    return '';
  }
}

async function build1ColDesign(block) {
  block.classList.add('one-col');
  const pricingCard = await decorateCard(block);
  const footer = decorateFooter(block);

  block.innerHTML = '';
  block.append(pricingCard);

  addPublishDependencies('/express/system/offers-new.json');
  wrapTextAndSup(block);
  block.append(footer);
  formatTextElements(block);
}

async function build2ColDesign(block) {
  invisContainer = createTag('div');
  parent = block.parentElement;
  invisContainer.style.visibility = 'hidden';
  invisContainer.style.display = 'block';
  invisContainer.append(block);
  const main = document.body.querySelector('main');
  main.append(invisContainer);
  block.classList.add('two-col');
  const leftCard = await decorateCard(block, 'puf-left');
  const rightCard = await decorateCard(block, 'puf-right');
  const footer = decorateFooter(block);
  block.innerHTML = '';
  block.append(leftCard, rightCard);

  await buildCarousel('.puf-card-container', block);
  updatePUFCarousel(block);
  addPublishDependencies('/express/system/offers-new.json');
  wrapTextAndSup(block);
  block.append(footer);
  alignP(block);
  formatTextElements(block);
  alignHighlights(block);
}

function getPUFDesign(block) {
  return block.children[1].children.length === 2 ? '2-col' : '1-col';
}

export default async function decorate(block) {
  if (getPUFDesign(block) === '1-col') {
    await build1ColDesign(block);
  }

  if (getPUFDesign(block) === '2-col') {
    await build2ColDesign(block);
  }
}
