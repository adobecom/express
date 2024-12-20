import {
  titleCase,
  getMetadata,
  getConfig,
} from './utils.js';

import getCKGData from './browse-api-controller.js';

import fetchAllTemplatesMetadata from './all-templates-metadata.js';
import { trackSearch, updateImpressionCache, generateSearchId } from './template-search-api-v3.js';

const defaultRegex = /\/express\/templates\/default/;

let ckgData;

async function fetchLinkList() {
  if (ckgData) return;
  const data = await getCKGData();
  // catch data from CKG API, if empty, use top priority categories sheet
  if (data) {
    ckgData = data.map((ckgItem) => {
      let formattedTasks;
      if (getMetadata('template-search-page') === 'Y') {
        const params = new Proxy(new URLSearchParams(window.location.search), {
          get: (searchParams, prop) => searchParams.get(prop),
        });
        formattedTasks = titleCase(params.tasks).replace(/[$@%"]/g, '');
      } else {
        formattedTasks = titleCase(getMetadata('tasks')).replace(/[$@%"]/g, '');
      }

      return {
        parent: formattedTasks,
        ckgID: ckgItem.metadata.ckgId,
        displayValue: ckgItem.canonicalName,
        value: ckgItem.metadata.link,
      };
    });
  }
}

const searchRegex = /\/search\?/;
function isSearch(pathname) {
  return searchRegex.test(pathname);
}

function replaceLinkPill(linkPill, data) {
  const clone = linkPill.cloneNode(true);
  if (data) {
    clone.innerHTML = clone.innerHTML.replace('/express/templates/default', data.url);
    clone.innerHTML = clone.innerHTML.replaceAll('Default', data['short-title']);
  }
  if (isSearch(data.url)) {
    clone.querySelectorAll('a').forEach((a) => {
      a.rel = 'nofollow';
    });
  }
  if (defaultRegex.test(clone.innerHTML)) {
    return null;
  }
  return clone;
}

async function updateSEOLinkList(container, linkPill, list) {
  const leftTrigger = container.querySelector('.carousel-left-trigger');
  const rightTrigger = container.querySelector('.carousel-right-trigger');

  container.innerHTML = '';

  const templatePages = await fetchAllTemplatesMetadata();

  if (list && templatePages) {
    if (leftTrigger) container.append(leftTrigger);

    list.forEach((d) => {
      const currentLocale = getConfig().locale.prefix.replace('/', '');
      const templatePageData = templatePages.find((p) => {
        const targetLocale = /^[a-z]{2}$/.test(p.url.split('/')[1]) ? p.url.split('/')[1] : '';
        const isLive = p.live === 'Y';
        const titleMatch = p['short-title']?.toLowerCase() === d.childSibling?.toLowerCase();
        const localeMatch = currentLocale === targetLocale;

        return isLive && titleMatch && localeMatch;
      });

      if (!templatePageData) return;

      const clone = replaceLinkPill(linkPill, templatePageData);
      if (clone) container.append(clone);
    });

    if (rightTrigger) container.append(rightTrigger);
  }
}

async function updateLinkList(container, linkPill, list) {
  const pageLinks = [];
  const searchLinks = [];
  const leftTrigger = container.querySelector('.carousel-left-trigger');
  const rightTrigger = container.querySelector('.carousel-right-trigger');
  container.innerHTML = '';

  const taskMeta = getMetadata('tasks');
  const currentTasks = taskMeta ? taskMeta.replace(/[$@%"]/g, '') : ' ';
  const currentTasksX = getMetadata('tasks-x') || '';

  if (!list) return;
  list.forEach((d) => {
    const { prefix } = getConfig().locale;
    const topics = getMetadata('topics') !== '" "' ? `${getMetadata('topics')?.replace(/[$@%"]/g, '')}` : '';
    const topicsQuery = `${topics} ${d.displayValue.toLowerCase()}`.split(' ')
      .filter((item, i, allItems) => i === allItems.indexOf(item))
      .join(' ')
      .replace(currentTasks, '')
      .replace(currentTasksX, '')
      .trim();

    let clone;
    if (!isSearch(d.pathname)) {
      const pageData = {
        url: `${prefix}${d.pathname}`,
        'short-title': d.displayValue,
      };

      clone = replaceLinkPill(linkPill, pageData);
      clone.innerHTML = clone.innerHTML
        .replaceAll('Default', d.displayValue)
        .replace('/express/templates/default', d.pathname);
      const innerLink = clone.querySelector('a');
      if (innerLink) {
        const url = new URL(innerLink.href);
        if (!url.searchParams.get('searchId')) {
          url.searchParams.set('searchId', generateSearchId());
          innerLink.href = url.toString();
        }
      }

      if (clone) pageLinks.push(clone);
    } else {
      // fixme: we need single page search UX
      const searchParams = `tasks=${currentTasks}&tasksx=${currentTasksX}&phformat=${getMetadata('placeholder-format')}&topics=${topicsQuery}&q=${d.displayValue}&ckgid=${d.ckgID}&searchId=${generateSearchId()}`;
      const pageData = {
        url: `${prefix}/express/templates/search?${searchParams}`,
        'short-title': d.displayValue,
      };

      clone = replaceLinkPill(linkPill, pageData);
      searchLinks.push(clone);
    }

    clone.addEventListener('click', () => {
      const a = clone.querySelector(':scope > a');
      updateImpressionCache({
        keyword_filter: d.displayValue,
        content_category: 'templates',
      });
      trackSearch('search-inspire', new URLSearchParams(new URL(a.href).search).get('searchId'));
    });
  });

  if (leftTrigger) container.append(leftTrigger);
  pageLinks.concat(searchLinks).forEach((clone) => {
    container.append(clone);
  });
  if (rightTrigger) container.append(rightTrigger);
}

async function lazyLoadLinklist() {
  await fetchLinkList();
  const linkList = document.querySelector('.link-list.fullwidth');

  if (linkList) {
    const linkListContainer = linkList.querySelector('p').parentElement;
    const linkListTemplate = linkList.querySelector('p').cloneNode(true);
    const linkListData = [];

    if (ckgData && getMetadata('short-title')) {
      ckgData.forEach((row) => {
        linkListData.push({
          ckgID: row.ckgID,
          shortTitle: getMetadata('short-title'),
          tasks: row.parent,
          displayValue: row.displayValue,
          pathname: row.value,
        });
      });
    }

    await updateLinkList(linkListContainer, linkListTemplate, linkListData);
    linkList.style.visibility = 'visible';
  } else {
    linkList?.remove();
  }
}

async function lazyLoadSEOLinkList() {
  await fetchLinkList();
  const seoNav = document.querySelector('.seo-nav');

  if (seoNav) {
    const topTemplatesContainer = seoNav.querySelector('p').parentElement;
    const topTemplates = getMetadata('top-templates');
    if (topTemplates) {
      const topTemplatesTemplate = seoNav.querySelector('p').cloneNode(true);
      const topTemplatesData = topTemplates.split(', ').map((cs) => ({ childSibling: cs }));

      await updateSEOLinkList(topTemplatesContainer, topTemplatesTemplate, topTemplatesData);
      const hiddenDiv = seoNav.querySelector('div[style="visibility: hidden;"]');
      if (hiddenDiv) hiddenDiv.style.visibility = 'visible';
    } else {
      topTemplatesContainer.innerHTML = '';
    }
  }
}

async function lazyLoadSearchMarqueeLinklist() {
  await fetchLinkList();
  const searchMarquee = document.querySelector('.search-marquee');

  if (searchMarquee) {
    const linkListContainer = searchMarquee.querySelector('.carousel-container > .carousel-platform');
    if (linkListContainer) {
      const linkListTemplate = linkListContainer.querySelector('p').cloneNode(true);

      const linkListData = [];

      if (ckgData && getMetadata('short-title')) {
        ckgData.forEach((row) => {
          linkListData.push({
            ckgID: row.ckgID,
            shortTitle: getMetadata('short-title'),
            tasks: row.parent, // parent tasks
            displayValue: row.displayValue,
            pathname: row.value,
          });
        });
      }

      await updateLinkList(linkListContainer, linkListTemplate, linkListData);
      linkListContainer.parentElement.classList.add('appear');
    }
  }
}

function hideAsyncBlocks() {
  const linkList = document.querySelector('.link-list.fullwidth');
  const seoNav = document.querySelector('.seo-nav');

  if (linkList) {
    linkList.style.visibility = 'hidden';
  }

  if (seoNav) {
    const topTemplatesContainer = seoNav.querySelector('p').parentElement;
    topTemplatesContainer.style.visibility = 'hidden';
  }
}

export default async function updateAsyncBlocks() {
  hideAsyncBlocks();
  // TODO: integrate memoization
  const showSearchMarqueeLinkList = getMetadata('show-search-marquee-link-list');
  if (!showSearchMarqueeLinkList || ['yes', 'true', 'on', 'Y'].includes(showSearchMarqueeLinkList)) {
    lazyLoadSearchMarqueeLinklist();
  }
  lazyLoadLinklist();
  lazyLoadSEOLinkList();
}
