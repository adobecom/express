/* eslint-disable no-underscore-dangle */

import {
  addPublishDependencies,
  createTag,
  getHelixEnv,
  getIconElement,
} from '../../scripts/utils.js';
import { getOffer } from '../../scripts/utils/pricing.js';

function replaceUrlParam(url, paramName, paramValue) {
  const params = url.searchParams;
  params.set(paramName, paramValue);
  url.search = params.toString();
  return url;
}

export function buildUrl(optionUrl, country, language) {
  const currentUrl = new URL(window.location.href);
  let planUrl = new URL(optionUrl);

  if (!planUrl.hostname.includes('commerce')) {
    return planUrl.href;
  }
  planUrl = replaceUrlParam(planUrl, 'co', country);
  planUrl = replaceUrlParam(planUrl, 'lang', language);
  let rUrl = planUrl.searchParams.get('rUrl');
  if (currentUrl.searchParams.has('host')) {
    const hostParam = currentUrl.searchParams.get('host');
    if (hostParam === 'express.adobe.com') {
      planUrl.hostname = 'commerce.adobe.com';
      if (rUrl) rUrl = rUrl.replace('express.adobe.com', hostParam);
    } else if (/qa\.adobeprojectm\.com/.test(hostParam)) {
      planUrl.hostname = 'commerce.adobe.com';
      if (rUrl) rUrl = rUrl.replace('express.adobe.com', hostParam);
    } else if (/\.adobeprojectm\.com/.test(hostParam)) {
      planUrl.hostname = 'commerce-stg.adobe.com';
      if (rUrl) rUrl = rUrl.replace('adminconsole.adobe.com', 'stage.adminconsole.adobe.com');
      if (rUrl) rUrl = rUrl.replace('express.adobe.com', hostParam);
    }
  }

  const env = getHelixEnv();
  if (env && env.commerce && planUrl.hostname.includes('commerce')) planUrl.hostname = env.commerce;
  if (env && env.spark && rUrl) {
    const url = new URL(rUrl);
    url.hostname = env.spark;
    rUrl = url.toString();
  }

  if (rUrl) {
    rUrl = new URL(rUrl);

    if (currentUrl.searchParams.has('touchpointName')) {
      rUrl = replaceUrlParam(rUrl, 'touchpointName', currentUrl.searchParams.get('touchpointName'));
    }
    if (currentUrl.searchParams.has('destinationUrl')) {
      rUrl = replaceUrlParam(rUrl, 'destinationUrl', currentUrl.searchParams.get('destinationUrl'));
    }
    if (currentUrl.searchParams.has('srcUrl')) {
      rUrl = replaceUrlParam(rUrl, 'srcUrl', currentUrl.searchParams.get('srcUrl'));
    }
  }

  if (currentUrl.searchParams.has('code')) {
    planUrl.searchParams.set('code', currentUrl.searchParams.get('code'));
  }

  if (currentUrl.searchParams.get('rUrl')) {
    rUrl = currentUrl.searchParams.get('rUrl');
  }

  if (rUrl) planUrl.searchParams.set('rUrl', rUrl.toString());
  return planUrl.href;
}

function decorateIconList(pricingRightEl) {
  let iconList = createTag('div', { class: 'pricing-iconlist' });
  let iconListDescription;
  [...pricingRightEl.firstElementChild.children].forEach((el) => {
    const imgEl = el.querySelector('img.icon, svg.icon');
    if (imgEl) {
      const iconListRow = createTag('div');
      const iconDiv = createTag('div', { class: 'pricing-iconlist-icon' });
      iconDiv.appendChild(imgEl);
      iconListRow.append(iconDiv);
      iconListDescription = createTag('div', { class: 'pricing-iconlist-description' });
      iconListRow.append(iconListDescription);
      iconListDescription.appendChild(el);
      iconList.appendChild(iconListRow);
    } else {
      if (iconList.children.length > 0) {
        pricingRightEl.appendChild(iconList);
        iconList = createTag('div', { class: 'pricing-iconlist' });
      }
      pricingRightEl.appendChild(el);
    }
  });
  if (iconList.children.length > 0) pricingRightEl.appendChild(iconList);
}

function selectPlan(block, plan) {
  const title = block.querySelector('.pricing-plan-title');
  const dropdown = block.querySelector('.pricing-plan-dropdown');
  title.innerText = plan.title;
  dropdown.innerHTML = '';
  plan.options.forEach((option) => {
    const optionEl = createTag('option');
    optionEl.innerText = option.title;
    optionEl.value = option.id;
    dropdown.append(optionEl);
  });
}

async function selectPlanOption(block, plan, planOption) {
  const priceLine = block.querySelector('.pricing-plan-price');
  const cta = block.querySelector('.cta');
  const countryOverride = new URLSearchParams(window.location.search).get('country');
  const offer = await getOffer(planOption.offerId, countryOverride);

  if (offer && offer.commerceURL) {
    plan.currency = offer.currency;
    plan.price = offer.unitPrice;
    plan.formatted = `${offer.unitPriceCurrencyFormatted}`;
    plan.country = offer.country;
    plan.language = offer.lang;
    plan.rawPrice = offer.unitPriceCurrencyFormatted.match(/[\d|,|.|e|E|+]+/g);
    plan.formatted = plan.formatted.replace(plan.rawPrice, `<span class="price">${plan.rawPrice}</span>`);
  }
  priceLine.innerHTML = plan.formatted;
  cta.href = buildUrl(planOption.link, plan.country, plan.language);
}

export function buildPlans(contentEls) {
  const plans = [];
  const planDivs = Array.from(contentEls.children);
  let plan;
  let planId = 0;
  let planOptionId = 0;
  planDivs.forEach((rowContent) => {
    const rowContents = Array.from(rowContent.children);
    rowContents.forEach((contentEl) => {
      if (contentEl.nodeName === 'H3') {
        plan = {
          id: planId,
          title: contentEl.innerText,
          country: 'us',
          language: 'en',
          options: [],
        };
        plans.push(plan);
        planId += 1;
      }

      if (contentEl.nodeName === 'P') {
        const linkEl = contentEl.querySelector('a');
        const link = new URL(linkEl.href);
        const params = link.searchParams;
        plan.options.push({
          id: planOptionId,
          offerId: params.get('items[0][id]'),
          title: contentEl.innerText,
          link: linkEl.href,
          price: '9.99',
          currency: 'US',
          symbol: '$',
        });
        planOptionId += 1;
      }
    });
  });

  return plans;
}

function populateOtherPlans(contentEls) {
  const otherPlans = [];
  const childrenEls = Array.from(contentEls.children);
  const otherPlanEls = Array.from(childrenEls[0].children);
  let id = 0;
  otherPlanEls.forEach((plan) => {
    if (plan.nodeName === 'P') {
      otherPlans.push({
        id,
        title: plan.innerText,
      });
      id += 1;
    }
  });

  return otherPlans;
}

function closeActivePopups(block, except) {
  block.querySelectorAll(':scope .active').forEach((activePopup) => {
    if (activePopup !== except) {
      activePopup.classList.remove('active');
    }
  });
  block.querySelectorAll(':scope .other-plan-button').forEach((planButton) => {
    planButton.classList.remove('pressed');
  });
}

function decorateOtherPlans(block, otherPlans) {
  const otherPlansContainer = block.querySelector('.other-plans-container');

  otherPlans.forEach((plan) => {
    const planEl = createTag('div', { class: 'other-plan' });
    const planButton = createTag('div', { class: 'other-plan-button' });
    const planIcon = getIconElement('chevron');
    planButton.innerHTML = `${plan.title}}`;
    planButton.append(planIcon);
    planButton.dataset.id = plan.id;
    planEl.append(planButton);
    const popup = createTag('div', { class: 'other-plan' });
    popup.append(plan.contents);
    popup.classList.add('other-plan-popup');
    // don't close popup if user clicks inside
    popup.addEventListener('click', (e) => e.stopPropagation());
    planEl.append(popup);
    otherPlansContainer.append(planEl);
    planButton.addEventListener('click', (e) => {
      e.stopPropagation();
      // close all other popups
      closeActivePopups(block, popup);
      // toggle pressed button state
      planButton.classList.toggle('pressed');
      // toggle this popup
      if (popup.classList.contains('active')) {
        popup.classList.remove('active');
      } else {
        if (window.innerWidth > 600) {
          const index = Array.from(otherPlansContainer.children).indexOf(planEl);
          if (index % 2) {
            const offset = planButton.offsetWidth + 20;
            popup.style.left = `-${offset}px`;
          }
        } else {
          popup.style.left = '0';
        }
        popup.classList.add('active');
      }
    });
  });
  // close all popups if user clicks anywhere on the page
  document.body.addEventListener('click', () => closeActivePopups(block));
}

function buildOtherPlan(otherPlans, row) {
  const contentEls = Array.from(row.children);
  const title = contentEls[0].innerText;
  const contents = contentEls[1];
  otherPlans.forEach((plan) => {
    if (plan.title === title) {
      plan.contents = contents;
    }
  });
}

function decoratePricing(block) {
  const rows = Array.from(block.children);
  let left = '';
  let right = '';
  let plans = [];
  let otherPlans = [];
  rows.forEach((row, index) => {
    if (index === 0) {
      left = row;
      left.classList.add('pricing-left');
    } else if (index === 1) {
      right = row;
      right.classList.add('pricing-right');
      decorateIconList(right);
    } else if (index === 2) {
      plans = buildPlans(row);
    } else if (index === 3) {
      otherPlans = populateOtherPlans(row);
      const otherPlansSection = createTag('div', { class: 'other-plans' });
      const otherPlansTitle = createTag('span', { class: 'other-plans-title' });
      const otherPlansContainer = createTag('div', { class: 'other-plans-container' });
      otherPlansTitle.innerText = row.querySelector('h3').innerText;
      otherPlansSection.append(otherPlansTitle);
      otherPlansSection.append(otherPlansContainer);
      right.append(otherPlansSection);
    } else {
      buildOtherPlan(otherPlans, row);
    }
  });
  if (plans?.length > 0) {
    block.innerHTML = '';
    const planSection = createTag('div', { class: 'pricing-plan' });
    const planSectionTitle = createTag('h2', { class: 'pricing-plan-title' });
    planSectionTitle.dataset.id = '0';
    const planSectionPrice = createTag('p', { class: 'pricing-plan-price' });
    const planSectionDropdown = createTag('select', { class: 'pricing-plan-dropdown' });
    planSectionDropdown.addEventListener('change', async () => {
      const planId = planSectionTitle.dataset.id;
      const planOptionId = planSectionDropdown.value;
      const plan = plans[planId];
      const planOption = plan.options[planOptionId];
      selectPlanOption(block, plan, planOption);
    });
    planSection.append(planSectionTitle);
    planSection.append(planSectionPrice);
    planSection.append(planSectionDropdown);
    left.prepend(planSection);
    block.append(left);
    block.append(right);
    const ctaButton = block.querySelector('a.button.accent');
    if (ctaButton) {
      ctaButton.classList.add('cta');
      ctaButton.classList.add('large');
    }

    selectPlan(block, plans[0]);
    selectPlanOption(block, plans[0], plans[0].options[0]);
    decorateOtherPlans(block, otherPlans);
    addPublishDependencies('/express/system/offers.json');
  }
}

export default function decorate(block) {
  decoratePricing(block);
}
