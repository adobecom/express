import { addPublishDependencies, createTag, getMetadata } from '../../scripts/utils.js';
import { buildUrl, fetchPlan, setVisitorCountry } from '../../scripts/utils/pricing.js';
import buildCarousel from '../shared/carousel.js';

let invisContainer;
let parent;

function pushPricingAnalytics(adobeEventName, sparkEventName, plan) {
  const url = new URL(window.location.href);
  const sparkTouchpoint = url.searchParams.get('touchpointName');

  /* eslint-disable no-underscore-dangle */
  /* global digitalData _satellite */
  digitalData._set('primaryEvent.eventInfo.eventName', adobeEventName);
  digitalData._set('spark.eventData.eventName', sparkEventName);
  digitalData._set(
    'spark.eventData.contextualData4',
    `billingFrequency:${plan.frequency}`,
  );
  digitalData._set(
    'spark.eventData.contextualData6',
    `commitmentType:${plan.frequency}`,
  );
  digitalData._set(
    'spark.eventData.contextualData7',
    `currencyCode:${plan.currency}`,
  );
  digitalData._set(
    'spark.eventData.contextualData9',
    `offerId:${plan.offerId}`,
  );
  digitalData._set('spark.eventData.contextualData10', `price:${plan.price}`);
  digitalData._set(
    'spark.eventData.contextualData12',
    `productName:${plan.name} - ${plan.frequency}`,
  );
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
  const plan = await fetchPlan(planUrl, false);

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
      pricingCta.href = buildUrl(plan.url, plan.country, plan.language, plan.offerId);
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
  const checkbox = createTag('input', {
    type: 'checkbox',
    class: 'puf-card-checkbox',
  });
  const slider = createTag('span', { class: 'puf-card-slider' });
  const defaultPlan = createTag('div', { class: 'strong' });
  const secondPlan = createTag('div');

  defaultPlan.innerHTML = plans[0].text.replace(
    plans[0].plan,
    `<span>${plans[0].plan}</span>`,
  );
  secondPlan.innerHTML = plans[1].text.replace(
    plans[1].plan,
    `<span>${plans[1].plan}</span>`,
  );

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
  const cardBorder = createTag('div', { class: 'puf-card-border' });
  const card = createTag('div', { class: cardClassName });
  const cardBanner = block.children[0].children[0];
  const cardTop = block.children[1].children[0];
  const cardBottom = block.children[2].children[0];
  const cardHeader = cardTop.querySelector('h3, p:first-of-type');
  const cardHeaderIcon = cardTop.querySelector('svg') || cardTop.querySelector('img');
  const cardPricingContainer = createTag('div', {
    class: 'puf-pricing-container',
  });
  const cardBasePriceHeader = createTag('h2', { class: 'puf-bp-header' });
  const cardPricingHeader = createTag('h2', { class: 'puf-pricing-header' });
  const cardPricingSufContainer = createTag('div', {
    class: 'puf-pricing-suf-container',
  });
  const cardPricingSuf = createTag('div', { class: 'puf-pricing-suf' });
  const cardVat = createTag('div', { class: 'puf-vat-info' });
  const cardAdditionalContext = createTag('div', {
    class: 'puf-pricing-context',
  });
  const cardPlansContainer = createTag('div', { class: 'puf-card-plans' });
  const cardCta = createTag('a', { class: 'button large' });
  const plansElement = cardTop.querySelectorAll('li');
  const listItems = cardBottom.querySelectorAll('svg');
  const plans = buildPlans(plansElement);

  if (cardClass === 'puf-left'
    && !['off', 'no', 'false'].includes(getMetadata('puf-left-reverse')?.toLowerCase())) {
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

  cardPricingContainer.append(
    cardBasePriceHeader,
    cardPricingHeader,
    cardPricingSufContainer,
  );
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
    cardBanner.innerHTML = createTag(
      'span',
      { class: 'banner-text' },
      cardBanner.innerHTML,
    ).outerHTML;
    cardBanner.classList.add('recommended');
  }

  if (cardHeaderIcon) formattedHeader.prepend(cardHeaderIcon);

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

  cardTop.querySelector('ul')
    ?.remove();

  const pricingContextContainer = cardTop.querySelector('em');
  if (pricingContextContainer) {
    cardAdditionalContext.textContent = pricingContextContainer.textContent.trim();
    pricingContextContainer.parentNode.remove();
  } else {
    cardAdditionalContext.remove();
  }

  // cardContainer.append(card);
  cardContainer.append(cardBorder);
  cardBorder.append(card);

  if (listItems) {
    listItems.forEach((listItem) => {
      listItem.parentNode.classList.add('puf-list-item');
    });
  }

  return cardContainer;
}

function wrapTextAndSup(block) {
  const supTags = block.getElementsByTagName('sup');
  Array.from(supTags)
    .forEach((supTag) => {
      supTag.classList.add('puf-sup');
    });

  const listItems = block.querySelectorAll('.puf-list-item');
  listItems.forEach((listItem) => {
    const { childNodes } = listItem;

    const filteredChildren = Array.from(childNodes)
      .filter((node) => {
        const isSvg = node.tagName && node.tagName.toLowerCase() === 'svg';
        const isTextNode = node.nodeType === Node.TEXT_NODE;
        return !isSvg && (isTextNode || node.nodeType === Node.ELEMENT_NODE);
      });

    const filteredChildrenExceptFirstText = filteredChildren.slice(1);

    const textAndSupWrapper = createTag('div', {
      class: 'puf-text-and-sup-wrapper',
    });
    textAndSupWrapper.append(...filteredChildrenExceptFirstText);
    listItem.append(textAndSupWrapper);
  });
}

function formatTextElements(block) {
  const highlightRegex = /^\(\(.*\)\)$/;
  const dividerRegex = /^--.*--$/;
  const blockElements = Array.from(block.querySelectorAll('*'));

  if (
    !blockElements.some(
      (el) => highlightRegex.test(el.textContent)
        || dividerRegex.test(el.textContent),
    )
  ) {
    return;
  }

  const highlightedEls = blockElements.filter((el) => highlightRegex.test(el.textContent));

  highlightedEls.forEach((el) => {
    el.classList.add('puf-highlighted-text');
    el.textContent = el.textContent
      .replace(/^\(\(/, '')
      .replace(/\)\)$/, '');
  });

  const dividerElements = blockElements.filter((el) => dividerRegex.test(el.textContent));

  dividerElements.forEach((el) => {
    el.classList.add('puf-divider-text');
    el.textContent = el.textContent
      .replace(/^--/, '')
      .replace(/--$/, '');
  });
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

function matchTwoElementsHeight(el1, el2) {
  // ^ not the clearest name (sets the shortest of two elements to the tallest element's height)
  if (el1 && el2) {
    const maxHeight = Math.max(
      el1.getBoundingClientRect().height,
      el2.getBoundingClientRect().height,
    );
    el1.style.height = `${maxHeight}px`;
    el2.style.height = `${maxHeight}px`;
  }
}

function alignContent() {
  const block = document.querySelector('.puf');
  const rightDescription = block.querySelector(
    '.puf-card.puf-right > .puf-card-top > p:last-of-type',
  );
  const leftDescription = block.querySelector(
    '.puf-card.puf-left > .puf-card-top > p:last-of-type',
  );
  const rightHeading = block.querySelector(
    '.puf-card.puf-right > .puf-card-bottom > h3',
  );
  const leftHeading = block.querySelector(
    '.puf-card.puf-left > .puf-card-bottom > h3',
  );

  if (rightDescription) rightDescription.style.height = 'auto';
  if (leftDescription) leftDescription.style.height = 'auto';
  if (rightHeading) rightHeading.style.height = 'auto';
  if (leftHeading) leftHeading.style.height = 'auto';

  if (window.innerWidth >= 900) {
    matchTwoElementsHeight(rightDescription, leftDescription);
    matchTwoElementsHeight(rightHeading, leftHeading);
  }
}

const resizeObserver = new ResizeObserver((entries) => {
  entries.forEach(() => {
    alignContent();
  });
});

async function build1ColDesign(block) {
  const pricingCard = await decorateCard(block);
  const footer = decorateFooter(block);

  block.innerHTML = '';
  block.append(pricingCard);

  addPublishDependencies('/express/system/offers-new.json?limit=5000');
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
  const leftCard = await decorateCard(block, 'puf-left');
  const rightCard = await decorateCard(block, 'puf-right');
  const footer = decorateFooter(block);
  block.innerHTML = '';
  block.append(leftCard, rightCard);
  await buildCarousel('.puf-card-container', block);
  parent.append(block);
  invisContainer.remove();
  resizeObserver.observe(rightCard);
  const options = {
    root: document.querySelector('.carousel-platform'),
    rootMargin: '0px',
    threshold: 0.55,
  };
  const carouselContainer = block.querySelector('.carousel-container');
  const callback = (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (window.innerWidth >= 900) {
        carouselContainer.style.maxHeight = 'none';
      } else {
        carouselContainer.style.maxHeight = `${entry.target.clientHeight}px`;
      }
    });
  };

  const intersectionObserver = new IntersectionObserver(callback, options);
  intersectionObserver.observe(rightCard);
  intersectionObserver.observe(leftCard);
  addPublishDependencies('/express/system/offers-new.json?limit=5000');
  wrapTextAndSup(block);
  block.append(footer);
  formatTextElements(block);
}
async function buildPUF(block) {
  const colCount = block?.children[1]?.children?.length;
  switch (colCount) {
    case 1:
      await build1ColDesign(block);
      break;
    case 2:
      await build2ColDesign(block);
      break;
    default:
      break;
  }
}

export default async function decorate(block) {
  setVisitorCountry();
  await buildPUF(block);
}
