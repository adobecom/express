/*
 * Copyright 2023 Adobe. All rights reserved.
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
  getLocale,
  getLanguage,
  getCookie,
  getHelixEnv,
  createTag,
} from '../scripts.js';

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
    const { host } = new URL(hostParam);
    if (host === 'express.adobe.com') {
      planUrl.hostname = 'commerce.adobe.com';
      if (rUrl) rUrl = rUrl.replace('express.adobe.com', hostParam);
    } else if (host === 'qa.adobeprojectm.com') {
      planUrl.hostname = 'commerce.adobe.com';
      if (rUrl) rUrl = rUrl.replace('express.adobe.com', hostParam);
    } else if (host.endsWith('.adobeprojectm.com')) {
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

function getCurrencyDisplay(currency) {
  if (currency === 'JPY') {
    return 'name';
  }
  if (['SEK', 'DKK', 'NOK'].includes(currency)) {
    return 'code';
  }
  return 'symbol';
}

function getCountry() {
  let country = new URLSearchParams(window.location.search).get('country');
  if (!country) {
    country = getCookie('international');
  }
  if (!country) {
    country = getLocale(window.location);
  }
  if (country === 'uk') country = 'gb';
  return (country.split('_')[0]);
}

export async function formatSalesPhoneNumber(tags) {
  if (tags.length <= 0) return;

  const numbersMap = await fetch('/express/system/business-sales-numbers.json').then((r) => r.json());

  if (!numbersMap?.data) return;

  tags.forEach((a) => {
    const r = numbersMap.data.find((d) => d.country === getCountry());

    if (!r) {
      a.textContent = a.href.replace('tel:', '').trim();
      return;
    }

    a.textContent = r.number.trim();
    a.href = `tel:${r.number.trim()}`;
  });
}

export function formatPrice(price, currency) {
  if (price === '') return null;

  const customSymbols = {
    SAR: 'SR',
    CA: 'CAD',
  };
  const locale = ['USD', 'TWD'].includes(currency)
    ? 'en-GB' // use en-GB for intl $ symbol formatting
    : getLanguage(getCountry());
  const currencyDisplay = getCurrencyDisplay(currency);
  let formattedPrice = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay,
  }).format(price);

  Object.entries(customSymbols).forEach(([symbol, replacement]) => {
    formattedPrice = formattedPrice.replace(symbol, replacement);
  });

  return formattedPrice;
}

export function getCurrency(locale) {
  const loc = locale || getCountry();
  const currencies = {
    ar: 'ARS',
    at: 'EUR',
    au: 'AUD',
    be: 'EUR',
    bg: 'EUR',
    br: 'BRL',
    ca: 'CAD',
    ch: 'CHF',
    cl: 'CLP',
    co: 'COP',
    cr: 'USD',
    cy: 'EUR',
    cz: 'EUR',
    de: 'EUR',
    dk: 'DKK',
    ec: 'USD',
    ee: 'EUR',
    es: 'EUR',
    fi: 'EUR',
    fr: 'EUR',
    gb: 'GBP',
    gr: 'EUR',
    gt: 'USD',
    hk: 'HKD',
    hu: 'EUR',
    id: 'IDR',
    ie: 'EUR',
    il: 'ILS',
    in: 'INR',
    it: 'EUR',
    jp: 'JPY',
    kr: 'KRW',
    lt: 'EUR',
    lu: 'EUR',
    lv: 'EUR',
    mt: 'EUR',
    mx: 'MXN',
    my: 'MYR',
    nl: 'EUR',
    no: 'NOK',
    nz: 'AUD',
    pe: 'PEN',
    ph: 'PHP',
    pl: 'EUR',
    pt: 'EUR',
    ro: 'EUR',
    ru: 'RUB',
    se: 'SEK',
    sg: 'SGD',
    si: 'EUR',
    sk: 'EUR',
    th: 'THB',
    tw: 'TWD',
    us: 'USD',
    ve: 'USD',
    za: 'USD',
    ae: 'USD',
    bh: 'BHD',
    eg: 'EGP',
    jo: 'JOD',
    kw: 'KWD',
    om: 'OMR',
    qa: 'USD',
    sa: 'SAR',
    ua: 'USD',
    dz: 'USD',
    lb: 'LBP',
    ma: 'USD',
    tn: 'USD',
    ye: 'USD',
    am: 'USD',
    az: 'USD',
    ge: 'USD',
    md: 'USD',
    tm: 'USD',
    by: 'USD',
    kz: 'USD',
    kg: 'USD',
    tj: 'USD',
    uz: 'USD',
    bo: 'USD',
    do: 'USD',
    hr: 'EUR',
    ke: 'USD',
    lk: 'USD',
    mo: 'HKD',
    mu: 'USD',
    ng: 'USD',
    pa: 'USD',
    py: 'USD',
    sv: 'USD',
    tt: 'USD',
    uy: 'USD',
    vn: 'USD',
  };
  return currencies[loc];
}

export async function getOffer(offerId, countryOverride) {
  let country = getCountry();
  if (countryOverride) country = countryOverride;
  if (!country) country = 'us';
  let currency = getCurrency(country);
  if (!currency) {
    country = 'us';
    currency = 'USD';
  }
  const resp = await fetch('/express/system/offers-new.json');
  if (!resp.ok) return {};
  const json = await resp.json();
  const upperCountry = country.toUpperCase();
  let offer = json.data.find((e) => (e.o === offerId) && (e.c === upperCountry));
  if (!offer) offer = json.data.find((e) => (e.o === offerId) && (e.c === 'US'));

  if (offer) {
    const lang = getLanguage(getLocale(window.location)).split('-')[0];
    const unitPrice = offer.p;
    const unitPriceCurrencyFormatted = formatPrice(unitPrice, currency);
    const commerceURL = `https://commerce.adobe.com/checkout?cli=spark&co=${country}&items%5B0%5D%5Bid%5D=${offerId}&items%5B0%5D%5Bcs%5D=0&rUrl=https%3A%2F%express.adobe.com%2Fsp%2F&lang=${lang}`;
    const vatInfo = offer.vat;
    const prefix = offer.pre;
    const suffix = offer.suf;
    const basePrice = offer.bp;
    const priceSuperScript = offer.sup;
    const basePriceCurrencyFormatted = formatPrice(basePrice, currency);

    return {
      country,
      currency,
      unitPrice,
      unitPriceCurrencyFormatted,
      commerceURL,
      lang,
      vatInfo,
      prefix,
      suffix,
      basePrice,
      basePriceCurrencyFormatted,
      priceSuperScript,
    };
  }
  return {};
}

export async function fetchPlan(planUrl) {
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
      plan.basePrice = offer.basePrice;
      plan.country = offer.country;
      plan.vatInfo = offer.vatInfo;
      plan.language = offer.lang;
      plan.rawPrice = offer.unitPriceCurrencyFormatted.match(/[\d\s,.+]+/g);
      plan.prefix = offer.prefix ?? '';
      plan.suffix = offer.suffix ?? '';
      plan.sup = offer.priceSuperScript ?? '';
      plan.formatted = offer.unitPriceCurrencyFormatted.replace(
        plan.rawPrice[0],
        `<strong>${plan.prefix}${plan.rawPrice[0]}</strong>`,
      );

      if (offer.basePriceCurrencyFormatted) {
        plan.rawBasePrice = offer.basePriceCurrencyFormatted.match(/[\d\s,.+]+/g);
        plan.formattedBP = offer.basePriceCurrencyFormatted.replace(
          plan.rawBasePrice[0],
          `<strong>${plan.prefix}${plan.rawBasePrice[0]}</strong>`,
        );
      }
    }

    window.pricingPlans[planUrl] = plan;
  }

  return plan;
}

export function decoratePricing(block) {
  const pricingLinks = block.querySelectorAll('a[title^="{{pricing"]');
  pricingLinks.forEach((priceLink) => {
    const priceType = priceLink.textContent.replace(/\{\{|}}/g, '').split('.')[1];
    fetchPlan(priceLink.href).then((response) => {
      if (response[priceType]) {
        const priceText = createTag('span', { class: 'inline-pricing' }, response[priceType]);
        priceLink.parentElement.replaceChild(priceText, priceLink);
      }
    });
  });
}
