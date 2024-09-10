import {
  createTag,
  fetchPlaceholders,
  getConfig,
  getIconElement,
  getMetadata,
} from '../../scripts/utils.js';
import { trackSearch, updateImpressionCache } from '../../scripts/template-search-api-v3.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

function handlelize(str) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/(\W+|\s+)/g, '-') // Replace space and other characters by hyphen
    .replace(/--+/g, '-') // Replaces multiple hyphens by one hyphen
    .replace(/(^-+|-+$)/g, '') // Remove extra hyphens from beginning or end of the string
    .toLowerCase(); // To lowercase
}

function wordExistsInString(word, inputString) {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexPattern = new RegExp(`(?:^|\\s|[.,!?()'"\\-])${escapedWord}(?:$|\\s|[.,!?()'"\\-])`, 'i');
  return regexPattern.test(inputString);
}

function cycleThroughSuggestions(block, targetIndex = 0) {
  const suggestions = block.querySelectorAll('.suggestions-list li');
  if (targetIndex >= suggestions.length || targetIndex < 0) return;
  if (suggestions.length > 0) suggestions[targetIndex].focus();
}

function initSearchFunction(block, searchBarWrapper) {
  const searchDropdown = searchBarWrapper.querySelector('.search-dropdown-container');
  const searchForm = searchBarWrapper.querySelector('.search-form');
  const searchBar = searchBarWrapper.querySelector('input.search-bar');
  const clearBtn = searchBarWrapper.querySelector('.icon-search-clear');
  const trendsContainer = searchBarWrapper.querySelector('.trends-container');
  const suggestionsContainer = searchBarWrapper.querySelector('.suggestions-container');
  const suggestionsList = searchBarWrapper.querySelector('.suggestions-list');

  clearBtn.style.display = 'none';

  const searchBarWatcher = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) {
      BlockMediator.set('stickySearchBar', {
        element: searchBarWrapper.cloneNode(true),
        loadSearchBar: true,
      });
    } else {
      BlockMediator.set('stickySearchBar', {
        element: searchBarWrapper.cloneNode(true),
        loadSearchBar: false,
      });
    }
  }, { rootMargin: '0px', threshold: 1 });

  searchBarWatcher.observe(searchBarWrapper);

  searchBar.addEventListener('click', (e) => {
    e.stopPropagation();
    searchBar.scrollIntoView({ behavior: 'smooth' });
    searchDropdown.classList.remove('hidden');
  }, { passive: true });

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

  searchBar.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.keyCode === 40) {
      e.preventDefault();
      cycleThroughSuggestions(block);
    }
  });

  document.addEventListener('click', (e) => {
    const { target } = e;
    if (target !== searchBarWrapper && !searchBarWrapper.contains(target)) {
      searchDropdown.classList.add('hidden');
    }
  }, { passive: true });

  const trimInput = (tasks, input) => {
    let alteredInput = input;
    tasks[0][1].sort((a, b) => b.length - a.length).forEach((word) => {
      alteredInput = alteredInput.toLowerCase().replace(word.toLowerCase(), '');
    });

    return alteredInput.trim();
  };

  const findTask = (map) => Object.entries(map).filter((task) => task[1].some((word) => {
    const searchValue = searchBar.value.toLowerCase();
    return wordExistsInString(word.toLowerCase(), searchValue);
  })).sort((a, b) => b[0].length - a[0].length);

  const redirectSearch = async () => {
    const placeholders = await fetchPlaceholders();
    const taskMap = placeholders['task-name-mapping'] ? JSON.parse(placeholders['task-name-mapping']) : {};
    const taskXMap = placeholders['x-task-name-mapping'] ? JSON.parse(placeholders['x-task-name-mapping']) : {};

    const format = getMetadata('placeholder-format');
    const currentTasks = {
      xCore: '',
      content: '',
    };
    let searchInput = searchBar.value?.toLowerCase() || getMetadata('topics');

    const tasksFoundInInput = findTask(taskMap);
    const tasksXFoundInInput = findTask(taskXMap);

    if (tasksFoundInInput.length > 0) {
      searchInput = trimInput(tasksFoundInInput, searchInput);
      [[currentTasks.xCore]] = tasksFoundInInput;
    }

    if (tasksXFoundInInput.length > 0) {
      searchInput = trimInput(tasksXFoundInInput, searchInput);
      [[currentTasks.content]] = tasksXFoundInInput;
    }
    const { prefix } = getConfig().locale;
    const topicUrl = searchInput ? `/${searchInput}` : '';
    const taskUrl = `/${handlelize(currentTasks.xCore.toLowerCase())}`;
    const taskXUrl = `/${handlelize(currentTasks.content.toLowerCase())}`;
    const targetPath = `${prefix}/express/templates${taskUrl}${topicUrl}`;
    const targetPathX = `${prefix}/express/templates${taskXUrl}${topicUrl}`;
    const { default: fetchAllTemplatesMetadata } = await import('../../scripts/all-templates-metadata.js');
    const allTemplatesMetadata = await fetchAllTemplatesMetadata();
    const pathMatch = (e) => e.url === targetPath;
    const pathMatchX = (e) => e.url === targetPathX;
    let targetLocation;

    updateImpressionCache({ collection: currentTasks.content || 'all-templates', content_category: 'templates' });
    trackSearch('search-inspire');

    const searchId = BlockMediator.get('templateSearchSpecs').search_id;
    if (allTemplatesMetadata.some(pathMatchX) && document.body.dataset.device !== 'mobile') {
      targetLocation = `${window.location.origin}${targetPathX}?searchId=${searchId || ''}`;
    } else if (allTemplatesMetadata.some(pathMatch) && document.body.dataset.device !== 'desktop') {
      targetLocation = `${window.location.origin}${targetPath}`;
    } else {
      const searchUrlTemplate = `/express/templates/search?tasks=${currentTasks.xCore}&tasksx=${currentTasks.content}&phformat=${format}&topics=${searchInput || "''"}&q=${searchBar.value || "''"}&searchId=${searchId || ''}`;
      targetLocation = `${window.location.origin}${prefix}${searchUrlTemplate}`;
    }

    window.location.assign(targetLocation);
  };

  const onSearchSubmit = async () => {
    searchBar.disabled = true;
    await redirectSearch();
  };

  async function handleSubmitInteraction(item, index) {
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
  }

  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    updateImpressionCache({
      status_filter: 'free',
      type_filter: 'all',
      collection: 'all-templates',
      search_keyword: searchBar.value || 'empty search',
      search_type: 'direct',
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
          await handleSubmitInteraction(item, index);
        });

        li.addEventListener('keydown', async (e) => {
          if (e.key === 'Enter' || e.keyCode === 13) {
            await handleSubmitInteraction(item, index);
          }
        });

        li.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown' || e.keyCode === 40) {
            e.preventDefault();
            cycleThroughSuggestions(block, index + 1);
          }
        });

        li.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowUp' || e.keyCode === 38) {
            e.preventDefault();
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

function decorateSearchFunctions(block, placeholders) {
  const searchBarWrapper = createTag('div', { class: 'search-bar-wrapper' });
  const searchForm = createTag('form', { class: 'search-form' });
  const searchBar = createTag('input', {
    class: 'search-bar',
    type: 'text',
    placeholder: placeholders['template-search-placeholder'] ?? 'Search for over 50,000 templates',
    enterKeyHint: placeholders.search ?? 'Search',
  });

  searchForm.append(searchBar);
  const searchIcon = getIconElement('search');
  searchIcon.loading = 'lazy';
  const searchClearIcon = getIconElement('search-clear');
  searchClearIcon.loading = 'lazy';
  searchBarWrapper.append(searchIcon, searchClearIcon);
  searchBarWrapper.append(searchForm);

  block.insertBefore(searchBarWrapper, block.querySelector('div:nth-of-type(2)'));
  return searchBarWrapper;
}

function decorateBackground(block) {
  const mediaRow = block.querySelector('div:nth-of-type(2)');
  if (mediaRow) {
    let media = mediaRow.querySelector('picture img');
    if (!media) {
      media = createTag('img');
      media.src = mediaRow.querySelector('a')?.href;
    }
    media.classList.add('backgroundimg');
    media.loading = 'eager';
    media.setAttribute('fetchpriority', 'high');
    block.prepend(media);
    mediaRow.remove();
  }
}

function buildSearchDropdown(block, searchBarWrapper, placeholders) {
  if (!searchBarWrapper) return;
  const dropdownContainer = createTag('div', { class: 'search-dropdown-container hidden' });
  const trendsContainer = createTag('div', { class: 'trends-container' });
  const suggestionsContainer = createTag('div', { class: 'suggestions-container hidden' });
  const suggestionsTitle = createTag('p', { class: 'dropdown-title' });
  const suggestionsList = createTag('ul', { class: 'suggestions-list' });

  const fromScratchLink = block.querySelector('a');
  const trendsTitle = placeholders['search-trends-title'];
  let trends;
  if (placeholders['search-trends']) trends = JSON.parse(placeholders['search-trends']);

  if (fromScratchLink) {
    const linkDiv = fromScratchLink.parentElement.parentElement;
    const templateFreeAccentIcon = getIconElement('template-free-accent');
    templateFreeAccentIcon.loading = 'lazy';
    const arrowRightIcon = getIconElement('arrow-right');
    arrowRightIcon.loading = 'lazy';
    fromScratchLink.prepend(templateFreeAccentIcon);
    fromScratchLink.append(arrowRightIcon);
    fromScratchLink.classList.remove('button');
    fromScratchLink.classList.add('from-scratch-link');
    fromScratchLink.href = getMetadata('search-marquee-from-scratch-link') || '/';
    trendsContainer.append(fromScratchLink);
    linkDiv.remove();
  }

  if (trendsTitle) {
    const trendsTitleEl = createTag('p', { class: 'dropdown-title' });
    trendsTitleEl.textContent = trendsTitle;
    trendsContainer.append(trendsTitleEl);
  }

  if (trends) {
    const trendsWrapper = createTag('ul', { class: 'trends-wrapper' });
    for (const [key, value] of Object.entries(trends)) {
      const trendLinkWrapper = createTag('li');
      const trendLink = createTag('a', { class: 'trend-link', href: value });
      trendLink.textContent = key;
      trendLinkWrapper.append(trendLink);
      trendsWrapper.append(trendLinkWrapper);
    }
    trendsContainer.append(trendsWrapper);
  }

  suggestionsTitle.textContent = placeholders['search-suggestions-title'] ?? '';
  suggestionsContainer.append(suggestionsTitle, suggestionsList);

  import('../../scripts/utils/free-plan.js')
    .then(({ buildFreePlanWidget }) => buildFreePlanWidget({ typeKey: 'branded', checkmarks: true }))
    .then((freePlanTags) => {
      const freePlanContainer = createTag('div', { class: 'free-plans-container' });
      freePlanContainer.append(freePlanTags);
      dropdownContainer.append(freePlanContainer);
    });
  dropdownContainer.append(trendsContainer, suggestionsContainer);
  searchBarWrapper.append(dropdownContainer);
}

async function decorateLinkList(block) {
  // preventing css. will be removed by buildCarousel
  block.querySelector(':scope > div:last-of-type').style.cssText = 'max-height: 90px; visibility: hidden;';
  const carouselItemsWrapper = block.querySelector(':scope > div:last-of-type > div');
  if (carouselItemsWrapper) {
    const showLinkList = getMetadata('show-search-marquee-link-list');
    if ((showLinkList && !['yes', 'true', 'on', 'Y'].includes(showLinkList))
      // no link list for templates root page
      || window.location.pathname.endsWith('/express/templates/')
      || window.location.pathname.endsWith('/express/templates')) {
      carouselItemsWrapper.remove();
    } else {
      const { default: buildCarousel } = await import('../shared/carousel.js');
      await buildCarousel(':scope > p', carouselItemsWrapper);
      const carousel = carouselItemsWrapper.querySelector('.carousel-container');
      block.append(carousel);
      carouselItemsWrapper.parentElement.remove();
    }
  }
  const blockLinks = block.querySelectorAll('a');
  if (blockLinks && blockLinks.length > 0) {
    const linksPopulated = new CustomEvent('linkspopulated', { detail: blockLinks });
    document.dispatchEvent(linksPopulated);
  }
  if (window.location.href.includes('/express/templates/')) {
    const { default: updateAsyncBlocks } = await import('../../scripts/template-ckg.js');
    updateAsyncBlocks();
  }
}

export default async function decorate(block) {
  decorateBackground(block);
  if (['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase())) {
    const logo = getIconElement('adobe-express-logo');
    logo.classList.add('express-logo');
    block.prepend(logo);
  }
  const placeholders = await fetchPlaceholders();
  const searchBarWrapper = decorateSearchFunctions(block, placeholders);
  buildSearchDropdown(block, searchBarWrapper, placeholders);
  initSearchFunction(block, searchBarWrapper);
  decorateLinkList(block);
}
