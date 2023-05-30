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
/* eslint-disable no-underscore-dangle */
import { getLanguage } from '../../scripts/scripts.js';

function extractFilterTerms(input) {
  if (!input || typeof input !== 'string') {
    return [];
  }
  return input
    .split(' AND ')
    .map((t) => t
      .replaceAll(' ', '')
      .toLowerCase());
}
function formatFilterString(filters) {
  const {
    animated,
    locales,
    premium,
    tasks,
    topics,
  } = filters;
  let str = '';
  if (premium && premium !== 'all') {
    if (premium.toLowerCase() === 'false') {
      str += '&filters=licensingCategory==free';
    } else {
      str += '&filters=licensingCategory==premium';
    }
  }
  if (animated && animated !== 'all') {
    if (animated.toLowerCase() === 'false') {
      str += '&filters=behaviors==still';
    } else {
      str += '&filters=behaviors==animated';
    }
  }

  extractFilterTerms(tasks).forEach((t) => {
    str += `&filters=pages.task.name==${t}`
  })
  extractFilterTerms(topics).forEach((t) => {
    str += `&filters=topics==${t}`
  })
  // locale needs backward compatibility with old api
  const cleanedLocales = locales?.toLowerCase();
  if (cleanedLocales) {
    str += `&filters=language==${
      cleanedLocales.split(' or ').map((l) => getLanguage(l.trim())).toString()
    }`;
  }

  return str;
}

const fetchSearchUrl = async ({
  limit, start, filters, sort, q,
}) => {
  const base = 'https://spark-search.adobe.io/v3/content';
  const collectionId = 'urn:aaid:sc:VA6C2:25a82757-01de-4dd9-b0ee-bde51dd3b418';
  const collectionIdParam = `collectionId=${collectionId}`;
  const queryType = 'assets';
  const queryParam = `&queryType=${queryType}`;
  const filterStr = formatFilterString(filters);
  const limitParam = limit || limit === 0 ? `&limit=${limit}` : '';
  const startParam = start ? `&start=${start}` : '';
  // FIXME: Can't use orderBy param. Need to work with API team on this.
  const sortParam = {
    'Most Viewed': '&orderBy=-remixCount',
    'Rare & Original': '&orderBy=remixCount',
    'Newest to Oldest': '&orderBy=-availabilityDate',
    'Oldest to Newest': '&orderBy=availabilityDate',
  }[sort] || sort || '';
  const qParam = q && q !== '{{q}}' ? `&q=${q}` : '';
  const url = encodeURI(
    `${base}?${collectionIdParam}${queryParam}${qParam}${limitParam}${startParam}${sortParam}${filterStr}`,
  );

  return fetch(url, {
    headers: {
      'x-api-key': 'projectx_marketing_web',
    },
  }).then((response) => response.json());
};

// FIXME: use placeholders/localize
function getFallbackMsg (tasks) {
  return `Sorry we couldn't find any results for what you searched for, try some of these popular `
    + (tasks ? `${tasks.toString()} ` : '') + 'templates instead.';
}

export async function fetchTemplates(props, fallback = true) {
  let response = await fetchSearchUrl(props);

  if (response?.metadata?.totalHits > 0) {
    return { response };
  }
  if (!fallback) {
    return { response: null };
  }
  const { filters: { tasks } } = props;
  if (tasks) {
    response = await fetchSearchUrl({ ...props, filters: { tasks } });
    if (response?.metadata?.totalHits > 0) {
      return { response, fallbackMsg: getFallbackMsg(tasks) }; 
    }
  }
  response = await fetchSearchUrl({ ...props, filters: {} });
  return { response, fallbackMsg: getFallbackMsg() };
}

function isValidBehaviors(behaviors) {
  const collectivelyExhausiveBehaviors = ['animated', 'video', 'still'];
  return behaviors.some((b) => collectivelyExhausiveBehaviors.includes(b))
    && (!behaviors.includes('still') || !(behaviors.includes('video') || behaviors.includes('animated')));
}

export function isValidTemplate(template) {
  return !!(template.status === 'approved'
    && template.customLinks?.branchUrl
    && template['dc:title']?.['i-default']
    && template.pages?.[0]?.rendition?.image?.thumbnail?.componentId
    && template._links?.['http://ns.adobe.com/adobecloud/rel/rendition']?.href?.replace
    && template._links?.['http://ns.adobe.com/adobecloud/rel/component']?.href?.replace
    && isValidBehaviors(template.behaviors));
}
