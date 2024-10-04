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

function handlelize(str) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/(\W+|\s+)/g, '-') // Replace space and other characters by hyphen
    .replace(/--+/g, '-') // Replaces multiple hyphens by one hyphen
    .replace(/(^-+|-+$)/g, '') // Remove extra hyphens from beginning or end of the string
    .toLowerCase(); // To lowercase
}

async function getTemplates(response, phs, fallbackMsg) {
  const filtered = response.items.filter((item) => isValidTemplate(item));
  const templates = await Promise.all(
    filtered.map((template) => renderTemplate(template, phs)),
  );
  return {
    fallbackMsg,
    templates,
  };
}

async function fetchAndRenderTemplates(props) {
  const [placeholders, { response, fallbackMsg }] = await Promise.all(
    [fetchPlaceholders(), fetchTemplates(props)],
  );
  if (!response || !response.items || !Array.isArray(response.items)) {
    return { templates: null };
  }

  if ('_links' in response) {
    // eslint-disable-next-line no-underscore-dangle
    const nextQuery = response._links.next.href;
    const starts = new URLSearchParams(nextQuery).get('start').split(',');
    props.start = starts.join(',');
  } else {
    props.start = '';
  }

  props.total = response.metadata.totalHits;

  // eslint-disable-next-line no-return-await
  return await getTemplates(response, placeholders, fallbackMsg);
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

    if (textWrapper.children.length === 1 && textWrapper.firstElementChild.className === 'button-container') {
      templateTitle.classList.add('link-only');
    }
  }

  block.prepend(templateTitle);

  if (props.orientation.toLowerCase() === 'horizontal') templateTitle.classList.add('horizontal');
}

async function formatHeadingPlaceholder(props) {
  // special treatment for express/ root url
  const placeholders = await fetchPlaceholders();
  const config = getConfig();
  const { region } = config.locale;
  const lang = config.locale.ietf;
  const templateCount = lang === 'es-ES' ? props.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : props.total.toLocaleString(lang);
  let toolBarHeading = getMetadata('toolbar-heading') ? props.templateStats : placeholders['template-placeholder'];

  if (getMetadata('template-search-page') === 'Y'
    && placeholders['template-search-heading-singular']
    && placeholders['template-search-heading-plural']) {
    toolBarHeading = props.total === 1 ? placeholders['template-search-heading-singular'] : placeholders['template-search-heading-plural'];
  }

  if (toolBarHeading) {
    toolBarHeading = toolBarHeading
      .replace('{{quantity}}', props.fallbackMsg ? '0' : templateCount)
      .replace('{{Type}}', titleCase(getMetadata('short-title') || getMetadata('q') || getMetadata('topics')))
      .replace('{{type}}', getMetadata('short-title') || getMetadata('q') || getMetadata('topics'));
    if (region === 'fr') {
      toolBarHeading.split(' ').forEach((word, index, words) => {
        if (index + 1 < words.length) {
          if (word === 'de' && wordStartsWithVowels(words[index + 1])) {
            words.splice(index, 2, `d'${words[index + 1].toLowerCase()}`);
            toolBarHeading = words.join(' ');
          }
        }
      });
    }
  }

  return toolBarHeading;
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
    const key = cols[0].querySelector('strong')?.textContent.trim().toLowerCase();
    if (cols.length === 1) {
      [props.contentRow] = cols;
    } else if (cols.length === 2) {
      const value = cols[1].textContent.trim();

      if (key && value) {
        // FIXME: facebook-post
        if (['tasks', 'topics', 'locales', 'behaviors'].includes(key) || (['premium', 'animated'].includes(key) && value.toLowerCase() !== 'all')) {
          props.filters[camelize(key)] = value;
        } else if (['yes', 'true', 'on', 'no', 'false', 'off'].includes(value.toLowerCase())) {
          props[camelize(key)] = ['yes', 'true', 'on'].includes(value.toLowerCase());
        } else if (key === 'collection id') {
          props[camelize(key)] = value.replaceAll('\\:', ':');
        } else {
          props[camelize(key)] = value;
        }
      }
    } else if (cols.length === 3) {
      if (key === 'template stats' && ['yes', 'true', 'on'].includes(cols[1].textContent.trim().toLowerCase())) {
        props[camelize(key)] = cols[2].textContent.trim();
      }
    } else if (cols.length === 4) {
      if (key === 'blank template') {
        cols[0].remove();
        props.templates.push(row);
      }
    } else if (cols.length === 5) {
      if (key === 'holiday block' && ['yes', 'true', 'on'].includes(cols[1].textContent.trim().toLowerCase())) {
        const backgroundColor = cols[3].textContent.trim().toLowerCase();
        let holidayIcon = cols[2].querySelector('picture');

        if (!holidayIcon) {
          const link = cols[2].querySelector('a');
          if (link && (link.href.endsWith('.svg') || link.href.endsWith('.png'))) {
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
        props.textColor = isDarkOverlayReadable(backgroundColor) ? 'dark-text' : 'light-text';
      }
    }
  });

  return props;
}

const SHORT_PLACEHOLDER_HEIGHT_CUTOFF = 80;
const WIDE_PLACEHOLDER_RATIO_CUTOFF = 1.3;

function adjustPlaceholderDimensions(block, props, tmplt, option) {
  const sep = option.includes(':') ? ':' : 'x';
  const ratios = option.split(sep).map((e) => +e);
  props.placeholderFormat = ratios;
  if (!ratios[1]) return;
  if (block.classList.contains('horizontal')) {
    const height = block.classList.contains('mini') ? 100 : 200;
    const width = (ratios[0] / ratios[1]) * height;
    tmplt.style = `width: ${width}px`;
    if (width / height > WIDE_PLACEHOLDER_RATIO_CUTOFF) {
      tmplt.classList.add('tall');
    }
  } else {
    const width = block.classList.contains('sixcols') || block.classList.contains('fullwidth') ? 165 : 200;
    const height = (ratios[1] / ratios[0]) * width;
    tmplt.style.height = `${height}px`;
    if (height < SHORT_PLACEHOLDER_HEIGHT_CUTOFF) tmplt.classList.add('short');
    if (width / height > WIDE_PLACEHOLDER_RATIO_CUTOFF) tmplt.classList.add('wide');
  }
}

function adjustTemplateDimensions(block, props, tmplt, isPlaceholder) {
  const overlayCell = tmplt.querySelector(':scope > div:last-of-type');
  const option = overlayCell.textContent.trim();
  if (!option) return;
  if (isPlaceholder) {
    // add aspect ratio to template
    adjustPlaceholderDimensions(block, props, tmplt, option);
  } else {
    // add icon to 1st cell
    const $icon = getIconElement(toClassName(option));
    $icon.setAttribute('title', option);
    tmplt.children[0].append($icon);
  }
  overlayCell.remove();
}

function populateTemplates(block, props, templates) {
  for (let tmplt of templates) {
    const isPlaceholder = tmplt.querySelector(':scope > div:first-of-type > img[src*=".svg"], :scope > div:first-of-type > svg');
    const linkContainer = tmplt.querySelector(':scope > div:nth-of-type(2)');
    const rowWithLinkInFirstCol = tmplt.querySelector(':scope > div:first-of-type > a');
    const innerWrapper = block.querySelector('.template-x-inner-wrapper');

    if (innerWrapper && linkContainer) {
      const link = linkContainer.querySelector(':scope a');
      if (link && isPlaceholder) {
        const aTag = createTag('a', {
          href: link.href || '#',
        });
        aTag.append(...tmplt.children);
        tmplt.remove();
        tmplt = aTag;
        // convert A to SPAN
        const newLink = createTag('span', { class: 'template-link' });
        newLink.append(link.textContent.trim());
        linkContainer.innerHTML = '';
        linkContainer.append(newLink);
      }
      innerWrapper.append(tmplt);
    }

    if (rowWithLinkInFirstCol && !tmplt.querySelector('img')) {
      props.tailButton = rowWithLinkInFirstCol;
      rowWithLinkInFirstCol.remove();
    }

    if (tmplt.children.length === 3) {
      // look for options in last cell
      adjustTemplateDimensions(block, props, tmplt, isPlaceholder);
    }

    if (!tmplt.querySelectorAll(':scope > div > *').length) {
      // remove empty row
      tmplt.remove();
    }
    tmplt.classList.add('template');
    if (isPlaceholder) {
      tmplt.classList.add('placeholder');
    }
  }
}

function updateLoadMoreButton(props, loadMore) {
  if (props.start === '') {
    loadMore.style.display = 'none';
  } else {
    loadMore.style.removeProperty('display');
  }
}

async function decorateNewTemplates(block, props, options = { reDrawMasonry: false }) {
  const { templates: newTemplates } = await fetchAndRenderTemplates(props);
  updateImpressionCache({ result_count: props.total });
  const loadMore = block.parentElement.querySelector('.load-more');

  props.templates = props.templates.concat(newTemplates);
  populateTemplates(block, props, newTemplates);

  const newCells = Array.from(block.querySelectorAll('.template:not(.appear)'));

  const templateLinks = block.querySelectorAll('.template:not(.appear) .button-container > a, a.template.placeholder');
  templateLinks.isSearchOverride = true;
  const linksPopulated = new CustomEvent('linkspopulated', { detail: templateLinks });
  document.dispatchEvent(linksPopulated);

  if (options.reDrawMasonry) {
    props.masonry.cells = [props.masonry.cells[0]].concat(newCells);
  } else {
    props.masonry.cells = props.masonry.cells.concat(newCells);
  }
  props.masonry.draw(newCells);

  if (loadMore) {
    updateLoadMoreButton(props, loadMore);
  }
}

async function decorateLoadMoreButton(block, props) {
  const placeholders = await fetchPlaceholders();
  const loadMoreDiv = createTag('div', { class: 'load-more' });
  const loadMoreButton = createTag('button', { class: 'load-more-button' });
  const loadMoreText = createTag('p', { class: 'load-more-text' });
  loadMoreDiv.append(loadMoreButton, loadMoreText);
  loadMoreText.textContent = placeholders['load-more'] ?? '';
  block.append(loadMoreDiv);
  loadMoreButton.append(getIconElement('plus-icon'));

  loadMoreButton.addEventListener('click', async () => {
    trackSearch('select-load-more', BlockMediator.get('templateSearchSpecs').search_id);
    loadMoreButton.classList.add('disabled');
    const scrollPosition = window.scrollY;
    await decorateNewTemplates(block, props);
    window.scrollTo({
      top: scrollPosition,
      left: 0,
      behavior: 'smooth',
    });
    loadMoreButton.classList.remove('disabled');
  });

  return loadMoreDiv;
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

  const searchId = new URLSearchParams(window.location.search).get('searchId');
  updateImpressionCache({
    search_keyword: getMetadata('q') || getMetadata('topics-x') || getMetadata('topics'),
    result_count: props.total,
    content_category: 'templates',
  });
  if (searchId) trackSearch('view-search-result', searchId);

  const templateLinks = block.querySelectorAll('.template .button-container > a, a.template.placeholder');
  templateLinks.isSearchOverride = true;
  const linksPopulated = new CustomEvent('linkspopulated', { detail: templateLinks });
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

        searchBar.addEventListener('keyup', () => {
          if (searchBar.value !== '') {
            clearBtn.style.display = 'inline-block';
            trendsContainer.classList.add('hidden');
            suggestionsContainer.classList.remove('hidden');
          } else {
            clearBtn.style.display = 'none';
            trendsContainer.classList.remove('hidden');
            suggestionsContainer.classList.add('hidden');
          }
        }, { passive: true });

        searchBar.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowDown' || event.keyCode === 40) {
            event.preventDefault();
            cycleThroughSuggestions(block);
          }
        });

        document.addEventListener('click', (event) => {
          const { target } = event;
          if (target !== searchWrapper && !searchWrapper.contains(target)) {
            searchWrapper.classList.add('collapsed');
            searchDropdown.classList.add('hidden');
            searchBar.value = '';
            suggestionsList.innerHTML = '';
            trendsContainer.classList.remove('hidden');
            suggestionsContainer.classList.add('hidden');
            clearBtn.style.display = 'none';
          }
        }, { passive: true });

        const redirectSearch = async () => {
          const placeholders = await fetchPlaceholders();
          const taskMap = placeholders['x-task-name-mapping'] ? JSON.parse(placeholders['task-name-mapping']) : {};

          const format = getMetadata('placeholder-format');
          let currentTasks = '';
          let searchInput = searchBar.value.toLowerCase() || getMetadata('topics');

          const tasksFoundInInput = Object.entries(taskMap)
            .filter((task) => task[1].some((word) => {
              const searchValue = searchBar.value.toLowerCase();
              return searchValue.indexOf(word.toLowerCase()) >= 0;
            })).sort((a, b) => b[0].length - a[0].length);

          if (tasksFoundInInput.length > 0) {
            tasksFoundInInput[0][1].sort((a, b) => b.length - a.length).forEach((word) => {
              searchInput = searchInput.toLowerCase().replace(word.toLowerCase(), '');
            });

            searchInput = searchInput.trim();
            [[currentTasks]] = tasksFoundInInput;
          }

          updateImpressionCache({ collection: currentTasks || 'all-templates', content_category: 'templates' });
          trackSearch('search-inspire');

          const { prefix } = getConfig().locale;
          const topicUrl = searchInput ? `/${searchInput}` : '';
          const taskUrl = `/${handlelize(currentTasks.toLowerCase())}`;
          const targetPath = `${prefix}/express/templates${taskUrl}${topicUrl}`;
          const searchId = BlockMediator.get('templateSearchSpecs').search_id;
          const allTemplatesMetadata = await fetchAllTemplatesMetadata();
          const pathMatch = (event) => event.url === targetPath;
          let targetLocation;

          if (allTemplatesMetadata.some(pathMatch)) {
            targetLocation = `${window.location.origin}${targetPath}?searchId=${searchId || ''}`;
          } else {
            const searchUrlTemplate = `/express/templates/search?tasks=${currentTasks}&phformat=${format}&topics=${searchInput || "''"}&q=${searchInput || "''"}&searchId=${searchId || ''}`;
            targetLocation = `${window.location.origin}${prefix}${searchUrlTemplate}`;
          }

          window.location.assign(targetLocation);
        };

        const onSearchSubmit = async () => {
          searchBar.disabled = true;
          await redirectSearch();
        };

        const handleSubmitInteraction = async (item, index) => {
          if (item.query !== searchBar.value) {
            searchBar.value = item.query;
            searchBar.dispatchEvent(new Event('input'));
          }
          updateImpressionCache({
            status_filter: 'free',
            type_filter: 'all',
            collection: 'all-templates',
            keyword_rank: index + 1,
            search_keyword: searchBar.value || 'empty search',
            search_type: 'autocomplete',
          });
          await onSearchSubmit();
        };

        searchForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          searchBar.disabled = true;
          updateImpressionCache({
            status_filter: 'free',
            type_filter: 'all',
            collection: 'all-templates',
            search_type: 'direct',
            search_keyword: searchBar.value || 'empty search',
          });
          await onSearchSubmit();
        });

        clearBtn.addEventListener('click', () => {
          searchBar.value = '';
          suggestionsList.innerHTML = '';
          trendsContainer.classList.remove('hidden');
          suggestionsContainer.classList.add('hidden');
          clearBtn.style.display = 'none';
        }, { passive: true });

        const suggestionsListUIUpdateCB = (suggestions) => {
          suggestionsList.innerHTML = '';
          const searchBarVal = searchBar.value.toLowerCase();
          if (suggestions && !(suggestions.length <= 1 && suggestions[0]?.query === searchBarVal)) {
            suggestions.forEach((item, index) => {
              const li = createTag('li', { tabindex: 0 });
              const valRegEx = new RegExp(searchBar.value, 'i');
              li.innerHTML = item.query.replace(valRegEx, `<b>${searchBarVal}</b>`);
              li.addEventListener('click', async () => {
                if (item.query === searchBar.value) return;
                searchBar.value = item.query;
                searchBar.dispatchEvent(new Event('input'));

                await handleSubmitInteraction(item, index);
              });

              li.addEventListener('keydown', async (event) => {
                if (event.key === 'Enter' || event.keyCode === 13) {
                  await handleSubmitInteraction(item, index);
                }
              });

              li.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowDown' || event.keyCode === 40) {
                  event.preventDefault();
                  cycleThroughSuggestions(block, index + 1);
                }
              });

              li.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowUp' || event.keyCode === 38) {
                  event.preventDefault();
                  cycleThroughSuggestions(block, index - 1);
                }
              });

              suggestionsList.append(li);
            });

            const suggestListString = suggestions.map((s) => s.query).join(',');
            updateImpressionCache({
              prefix_query: searchBarVal,
              suggestion_list_shown: suggestListString,
            });
          }
        };

        import('../../scripts/autocomplete-api-v3.js').then(({ default: useInputAutocomplete }) => {
          const { inputHandler } = useInputAutocomplete(
            suggestionsListUIUpdateCB, { throttleDelay: 300, debounceDelay: 500, limit: 7 },
          );
          searchBar.addEventListener('input', inputHandler);
        });
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
