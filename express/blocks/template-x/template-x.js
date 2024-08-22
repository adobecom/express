import isDarkOverlayReadable from '../../scripts/color-tools.js';
import { addTempWrapper } from '../../scripts/decorate.js';
import {
  createOptimizedPicture,
  createTag,
  fetchPlaceholders,
  getConfig,
  getIconElement,
  getLottie,
  lazyLoadLottiePlayer,
} from '../../scripts/utils.js';
import { fetchTemplatesCategoryCount, gatherPageImpression, updateImpressionCache } from '../../scripts/template-search-api-v3.js'
import buildCarousel from '../shared/carousel.js';
import { Masonry } from '../shared/masonry.js';

import {
  decorateLoadMoreButton, fetchAndRenderTemplates, populateTemplates,
} from './core.js';

import {
  decorateHoliday,
} from './template-x-holiday-banner.js';
import { decorateToolbar } from './template-x-ui.js';

import {

  importSearchBar
} from "./template-x-search-bar.js"

function camelize(str) {
  return str.replace(/^\w|[A-Z]|\b\w/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase())).replace(/\s+/g, '');
}

async function attachFreeInAppPills(block) {
  const freeInAppText = await fetchPlaceholders().then(
    (json) => json['free-in-app'],
  );

  const templateLinks = block.querySelectorAll('a.template');
  for (const templateLink of templateLinks) {
    if (
      !block.classList.contains('apipowered')
      && templateLink.querySelectorAll('.icon-premium').length <= 0
      && !templateLink.classList.contains('placeholder')
      && !templateLink.querySelector('.icon-free-badge')
      && freeInAppText
    ) {
      const $freeInAppBadge = createTag('span', {
        class: 'icon icon-free-badge',
      });
      $freeInAppBadge.textContent = freeInAppText;
      templateLink.querySelector('div').append($freeInAppBadge);
    }
  }
}

function updateLottieStatus(block) {
  const drawer = block.querySelector('.filter-drawer-mobile');
  const inWrapper = drawer.querySelector('.filter-drawer-mobile-inner-wrapper');
  const lottieArrows = drawer.querySelector('.lottie-wrapper');
  if (lottieArrows) {
    if (
      inWrapper.scrollHeight - inWrapper.scrollTop
      === inWrapper.offsetHeight
    ) {
      lottieArrows.style.display = 'none';
      drawer.classList.remove('scrollable');
    } else {
      lottieArrows.style.removeProperty('display');
      drawer.classList.add('scrollable');
    }
  }
}

async function fetchCntSpan(props, anchor, lang) {
  const cntSpan = createTag('span', { class: 'category-list-template-count' });
  const cnt = await fetchTemplatesCategoryCount(props, anchor.dataset.tasks);
  cntSpan.textContent = `(${cnt.toLocaleString(lang)})`;
  return { cntSpan, anchor };
}

async function appendCategoryTemplatesCount(block, props) {
  if (props.loadedOtherCategoryCounts) {
    return;
  }
  props.loadedOtherCategoryCounts = true;
  const categories = block.querySelectorAll('ul.category-list > li');
  const lang = getConfig().locale.ietf;

  const fetchCntSpanPromises = [...categories]
    .map((li) => fetchCntSpan(props, li.querySelector('a'), lang));
  const res = await Promise.all(fetchCntSpanPromises);

  // append one by one to gain attention
  for (const { cntSpan, anchor } of res) {
    anchor.append(cntSpan);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

async function decorateCategoryList(block, props) {
  const placeholders = await fetchPlaceholders();
  const { prefix } = getConfig().locale;
  const mobileDrawerWrapper = block.querySelector('.filter-drawer-mobile');
  const drawerWrapper = block.querySelector(
    '.filter-drawer-mobile-inner-wrapper',
  );
  const categories = placeholders['x-task-categories']
    ? JSON.parse(placeholders['x-task-categories'])
    : {};
  const categoryIcons = placeholders['task-category-icons']
    ?.replace(/\s/g, '')
    ?.split(',');
  const categoriesDesktopWrapper = createTag('div', {
    class: 'category-list-wrapper',
  });
  const categoriesToggleWrapper = createTag('div', {
    class: 'category-list-toggle-wrapper',
  });
  const categoriesToggle = getIconElement('drop-down-arrow');
  const categoriesListHeading = createTag('div', {
    class: 'category-list-heading',
  });
  const categoriesList = createTag('ul', { class: 'category-list' });

  categoriesListHeading.append(
    getIconElement('template-search'),
    placeholders['jump-to-category'],
  );
  categoriesToggleWrapper.append(categoriesToggle);
  categoriesDesktopWrapper.append(
    categoriesToggleWrapper,
    categoriesListHeading,
    categoriesList,
  );

  Object.entries(categories).forEach((category, index) => {
    const format = `${props.placeholderFormat[0]}:${props.placeholderFormat[1]}`;
    const targetTasks = category[1];
    const currentTasks = props.filters.tasks ? props.filters.tasks : "''";
    const currentTopic = props.filters.topics || props.q;

    const listItem = createTag('li');
    if (category[1] === currentTasks) {
      listItem.classList.add('active');
    }

    let icon;
    if (categoryIcons[index] && categoryIcons[index] !== '') {
      icon = categoryIcons[index];
    } else {
      icon = 'template-static';
    }

    const iconElement = getIconElement(icon);
    const a = createTag('a', {
      'data-tasks': targetTasks,
      href: `${prefix}/express/templates/search?tasks=${targetTasks}&tasksx=${targetTasks}&phformat=${format}&topics=${currentTopic || "''"
        }&q=${currentTopic || ''}`,
    });
    [a.textContent] = category;

    a.prepend(iconElement);
    listItem.append(a);
    categoriesList.append(listItem);

    a.addEventListener('click', () => {
      updateImpressionCache({
        category_filter: a.dataset.tasks,
        collection: a.dataset.topics,
        collection_path: window.location.pathname,
        content_category: 'templates',
      });
      trackSearch('search-inspire', new URLSearchParams(new URL(a.href).search).get('searchId'));
    }, { passive: true });
  });

  categoriesDesktopWrapper.addEventListener(
    'mouseover',
    () => {
      appendCategoryTemplatesCount(block, props);
    },
    { once: true },
  );

  const categoriesMobileWrapper = categoriesDesktopWrapper.cloneNode({
    deep: true,
  });
  const mobileCategoriesToggle = createTag('span', {
    class: 'category-list-toggle',
  });
  mobileCategoriesToggle.textContent = placeholders['jump-to-category'] ?? '';
  categoriesMobileWrapper
    .querySelector('.category-list-toggle-wrapper > .icon')
    ?.replaceWith(mobileCategoriesToggle);
  const lottieArrows = createTag('a', { class: 'lottie-wrapper' });
  mobileDrawerWrapper.append(lottieArrows);
  drawerWrapper.append(categoriesMobileWrapper);
  lottieArrows.innerHTML = getLottie(
    'purple-arrows',
    '/express/icons/purple-arrows.json',
  );
  lazyLoadLottiePlayer();

  block.prepend(categoriesDesktopWrapper);
  block.classList.add('with-categories-list');

  const toggleButton = categoriesMobileWrapper.querySelector(
    '.category-list-toggle-wrapper',
  );
  toggleButton.append(getIconElement('drop-down-arrow'));
  toggleButton.addEventListener(
    'click',
    () => {
      const listWrapper = toggleButton.parentElement;
      toggleButton.classList.toggle('collapsed');
      if (toggleButton.classList.contains('collapsed')) {
        if (listWrapper.classList.contains('desktop-only')) {
          listWrapper.classList.add('collapsed');
          listWrapper.style.maxHeight = '40px';
        } else {
          listWrapper.classList.add('collapsed');
          listWrapper.style.maxHeight = '24px';
        }
      } else {
        listWrapper.classList.remove('collapsed');
        listWrapper.style.maxHeight = '1000px';
      }

      setTimeout(() => {
        if (!listWrapper.classList.contains('desktop-only')) {
          updateLottieStatus(block);
        }
      }, 510);
    },
    { passive: true },
  );

  lottieArrows.addEventListener(
    'click',
    () => {
      drawerWrapper.scrollBy({
        top: 300,
        behavior: 'smooth',
      });
    },
    { passive: true },
  );

  drawerWrapper.addEventListener(
    'scroll',
    () => {
      updateLottieStatus(block);
    },
    { passive: true },
  );
}

async function decorateTemplates(block, props) {
  const impression = gatherPageImpression(props);
  updateImpressionCache(impression);
  const innerWrapper = block.querySelector('.template-x-inner-wrapper');

  let rows = block.children.length;

  const templates = Array.from(innerWrapper.children);

  rows = templates.length;
  let breakpoints = [{ width: '400' }];

  if (rows > 6 && !block.classList.contains('horizontal')) {
    innerWrapper.classList.add('masonry');
  }

  if (rows === 1) {
    block.classList.add('large');
    breakpoints = [
      {
        media: '(min-width: 600px)',
        width: '2000',
      },
      { width: '750' },
    ];
  }

  block.querySelectorAll(':scope picture > img').forEach((img) => {
    const { src, alt } = img;
    img.parentNode.replaceWith(
      createOptimizedPicture(src, alt, true, breakpoints),
    );
  });

  // find the edit link and turn the template DIV into the A
  // A
  // +- DIV
  //    +- PICTURE
  // +- DIV
  //    +- SPAN
  //       +- "Edit this template"
  //
  // make copy of children to avoid modifying list while looping

  populateTemplates(block, props, templates);
  if (props.orientation.toLowerCase() !== 'horizontal') {
    if (
      rows > 6
      || block.classList.contains('sixcols')
      || block.classList.contains('fullwidth')
    ) {
      /* flex masonry */

      if (innerWrapper) {
        const cells = Array.from(innerWrapper.children);
        innerWrapper.classList.remove('masonry');
        innerWrapper.classList.add('flex-masonry');
        props.masonry = new Masonry(innerWrapper, cells);
      } else {
        block.remove();
      }

      props.masonry.draw();
      window.addEventListener('resize', () => {
        props.masonry.draw();
      });
    } else {
      block.classList.add('template-x-complete');
    }
  }

  await attachFreeInAppPills(block);

  const templateLinks = block.querySelectorAll(
    '.template .button-container > a, a.template.placeholder',
  );
  const linksPopulated = new CustomEvent('linkspopulated', {
    detail: templateLinks,
  });
  document.dispatchEvent(linksPopulated);
}

async function decorateBreadcrumbs(block) {
  // breadcrumbs are desktop-only
  if (document.body.dataset.device !== 'desktop') return;
  const { default: getBreadcrumbs } = await import('./breadcrumbs.js');
  const breadcrumbs = await getBreadcrumbs();
  if (breadcrumbs) block.prepend(breadcrumbs);
}

function renderFallbackMsgWrapper(block, { fallbackMsg }) {
  let fallbackMsgWrapper = block.querySelector(
    '.template-x-fallback-msg-wrapper',
  );
  if (!fallbackMsgWrapper) {
    fallbackMsgWrapper = createTag('div', {
      class: 'template-x-fallback-msg-wrapper',
    });
    block.append(fallbackMsgWrapper);
  }
  if (!fallbackMsg) {
    fallbackMsgWrapper.textContent = '';
  } else {
    fallbackMsgWrapper.textContent = fallbackMsg;
  }
}

async function processContentRow(block, props) {
  const templateTitle = createTag('div', { class: 'template-title' });
  const textWrapper = createTag('div', { class: 'text-wrapper' });
  textWrapper.innerHTML = props.contentRow.outerHTML;
  templateTitle.append(textWrapper);

  const aTags = templateTitle.querySelectorAll(':scope a');

  if (aTags.length > 0) {
    templateTitle.classList.add('with-link');
    aTags.forEach((aTag) => {
      aTag.className = 'template-title-link';

      const p = aTag.closest('p');
      if (p) {
        templateTitle.append(p);
        p.className = 'view-all-link-wrapper';
      }
    });

    if (
      textWrapper.children.length === 1
      && textWrapper.firstElementChild.className === 'button-container'
    ) {
      templateTitle.classList.add('link-only');
    }
  }

  block.prepend(templateTitle);

  if (props.orientation.toLowerCase() === 'horizontal') templateTitle.classList.add('horizontal');
}

function wordExistsInString(word, inputString) {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexPattern = new RegExp(
    `(?:^|\\s|[.,!?()'"\\-])${escapedWord}(?:$|\\s|[.,!?()'"\\-])`,
    'i',
  );
  return regexPattern.test(inputString);
}

function getTaskNameInMapping(text, placeholders) {
  const taskMap = placeholders['x-task-name-mapping'] ? JSON.parse(placeholders['x-task-name-mapping']) : {};
  return Object.entries(taskMap)
    .filter((task) => task[1].some((word) => {
      const searchValue = text.toLowerCase();
      return wordExistsInString(word.toLowerCase(), searchValue);
    }))
    .sort((a, b) => b[0].length - a[0].length);
}


async function buildTabs(block, props) {
  block.classList.add('tabbed');
  const tabs = props.tabs.split(',');
  const templatesWrapper = block.querySelector('.template-x-inner-wrapper');
  const textWrapper = block.querySelector(
    '.template-title .text-wrapper > div',
  );
  const tabsWrapper = createTag('div', { class: 'template-tabs' });
  const tabBtns = [];

  const placeholders = await fetchPlaceholders();
  const collectionRegex = /(.+?)\s*\((.+?)\)/;
  const tabConfigs = tabs.map((tab) => {
    const match = collectionRegex.exec(tab.trim());
    if (match) {
      return { tab: match[1], collectionId: match[2] };
    }
    return { tab, collectionId: props.collectionId };
  });

  const taskNames = tabConfigs.map(({ tab }) => getTaskNameInMapping(tab, placeholders));
  if (taskNames.length === tabs.length) {
    taskNames.filter(({ length }) => length).forEach(([[task]], index) => {
      const tabBtn = createTag('button', { class: 'template-tab-button' });
      tabBtn.textContent = tabConfigs[index].tab;
      tabsWrapper.append(tabBtn);
      tabBtns.push(tabBtn);

      if (props.filters.tasks === task) {
        tabBtn.classList.add('active');
      }

      tabBtn.addEventListener('click', async () => {
        templatesWrapper.style.opacity = 0;
        const {
          templates: newTemplates,
          fallbackMsg: newFallbackMsg,
        } = await fetchAndRenderTemplates({
          ...props,
          start: '',
          filters: {
            ...props.filters,
            tasks: task,
          },
          collectionId: tabConfigs[index].collectionId,
        });
        if (newTemplates?.length > 0) {
          props.fallbackMsg = newFallbackMsg;
          renderFallbackMsgWrapper(block, props);

          templatesWrapper.innerHTML = '';
          props.templates = newTemplates;
          props.templates.forEach((template) => {
            templatesWrapper.append(template);
          });

          await decorateTemplates(block, props);
          buildCarousel(':scope > .template', templatesWrapper);
          templatesWrapper.style.opacity = 1;
        }

        tabsWrapper.querySelectorAll('.template-tab-button').forEach((btn) => {
          if (btn !== tabBtn) btn.classList.remove('active');
        });
        tabBtn.classList.add('active');
      }, { passive: true });
    });

    document.dispatchEvent(
      new CustomEvent('linkspopulated', { detail: tabBtns }),
    );
  }

  textWrapper.append(tabsWrapper);

}

async function buildTemplateList(block, props, type = []) {
  if (type?.length > 0) {
    type.forEach((typeName) => {
      block.parentElement.classList.add(typeName);
      block.classList.add(typeName);
    });
  }

  if (!props.templateStats) {
    await processContentRow(block, props);
  }

  const { templates, fallbackMsg } = await fetchAndRenderTemplates(props);

  if (templates?.length === 0) {
    window.lana.log(
      `failed to load templates with props: ${JSON.stringify(props)}`,
      { tags: 'templates-api' },
    );

    if (getConfig().env.name === 'prod') {
      block.remove();
    } else {
      block.textContent = 'Error loading templates, please refresh the page or try again later.';
    }
    return;
  }

  props.fallbackMsg = fallbackMsg;
  renderFallbackMsgWrapper(block, props);
  const blockInnerWrapper = createTag('div', {
    class: 'template-x-inner-wrapper',
  });
  block.append(blockInnerWrapper);
  props.templates = props.templates.concat(templates);
  props.templates.forEach((template) => {
    blockInnerWrapper.append(template);
  });

  await decorateTemplates(block, props);


  if (props.tabs) {
    buildTabs(block, props)
  }

  if (props.loadMoreTemplates) {
    await decorateLoadMoreButton(block, props);
  }

  if (props.toolBar) {
    await decorateToolbar(block, props);
    await decorateCategoryList(block, props);
  }

  if (props.toolBar && props.searchBar) {
    import('../../scripts/block-mediator.min.js').then(
      ({ default: blockMediator }) => {
        importSearchBar(block, blockMediator);
      },
    );
  }

  await decorateBreadcrumbs(block);

  if (
    props?.orientation.toLowerCase() === 'horizontal'
  ) {
    const innerWrapper = block.querySelector('.template-x-inner-wrapper');
    if (innerWrapper) {
      buildCarousel(':scope > .template', innerWrapper);
    } else {
      block.remove();
    }
  }

  props.holidayBlock && decorateHoliday(block, props);
}

function determineTemplateXType(props) {
  // todo: build layers of aspects based on props conditions - i.e. orientation -> style -> use case
  const type = [];

  // orientation aspect
  if (props.orientation && props.orientation.toLowerCase() === 'horizontal') type.push('horizontal');

  // style aspect
  if (props.width && props.width.toLowerCase() === 'full') type.push('fullwidth');
  if (props.width && props.width.toLowerCase() === 'sixcols') type.push('sixcols');
  if (props.width && props.width.toLowerCase() === 'fourcols') type.push('fourcols');
  if (props.mini) type.push('mini');

  // use case aspect
  if (props.holidayBlock) type.push('holiday');

  return type;
}

function constructProps(block) {
  const props = {
    templates: [],
    filters: {
      locales: 'en',
      topics: '',
    },
    renditionParams: {
      format: 'jpg',
      size: 151,
    },
    tailButton: '',
    limit: 70,
    total: 0,
    start: '',
    collectionId: 'urn:aaid:sc:VA6C2:25a82757-01de-4dd9-b0ee-bde51dd3b418',
    sort: '',
    masonry: undefined,
    headingTitle: null,
    headingSlug: null,
    viewAllLink: null,
    holidayIcon: null,
    backgroundColor: '#000B1D',
    backgroundAnimation: null,
    textColor: '#FFFFFF',
    loadedOtherCategoryCounts: false,
  };

  Array.from(block.children).forEach((row) => {
    const cols = row.querySelectorAll('div');
    const key = cols[0]
      .querySelector('strong')
      ?.textContent.trim()
      .toLowerCase();
    if (cols.length === 1) {
      [props.contentRow] = cols;
    } else if (cols.length === 2) {
      const value = cols[1].textContent.trim();

      if (key && value) {
        // FIXME: facebook-post
        if (
          ['tasks', 'topics', 'locales', 'behaviors'].includes(key)
          || (['premium', 'animated'].includes(key)
            && value.toLowerCase() !== 'all')
        ) {
          props.filters[camelize(key)] = value;
        } else if (
          ['yes', 'true', 'on', 'no', 'false', 'off'].includes(
            value.toLowerCase(),
          )
        ) {
          props[camelize(key)] = ['yes', 'true', 'on'].includes(
            value.toLowerCase(),
          );
        } else if (key === 'collection id') {
          props[camelize(key)] = value.replaceAll('\\:', ':');
        } else {
          props[camelize(key)] = value;
        }
      }
    } else if (cols.length === 3) {
      if (
        key === 'template stats'
        && ['yes', 'true', 'on'].includes(cols[1].textContent.trim().toLowerCase())
      ) {
        props[camelize(key)] = cols[2].textContent.trim();
      }
    } else if (cols.length === 4) {
      if (key === 'blank template') {
        cols[0].remove();
        props.templates.push(row);
      }
    } else if (cols.length === 5) {
      if (
        key === 'holiday block'
        && ['yes', 'true', 'on'].includes(cols[1].textContent.trim().toLowerCase())
      ) {
        const backgroundColor = cols[3].textContent.trim().toLowerCase();
        let holidayIcon = cols[2].querySelector('picture');

        if (!holidayIcon) {
          const link = cols[2].querySelector('a');
          if (
            link
            && (link.href.endsWith('.svg') || link.href.endsWith('.png'))
          ) {
            holidayIcon = createOptimizedPicture(link.href);
          }
        }
        const backgroundAnimation = cols[4].querySelector('a');

        props.holidayBlock = true;
        props.holidayIcon = holidayIcon || null;
        if (backgroundColor) {
          props.backgroundColor = backgroundColor;
        }
        props.backgroundAnimation = backgroundAnimation || null;
        props.textColor = isDarkOverlayReadable(backgroundColor)
          ? 'dark-text'
          : 'light-text';
      }
    }
  });

  return props;
}

export default async function decorate(block) {
  addTempWrapper(block, 'template-x');
  const props = constructProps(block);
  console.log(props)
  block.innerHTML = '';
  await buildTemplateList(block, props, determineTemplateXType(props));
}
