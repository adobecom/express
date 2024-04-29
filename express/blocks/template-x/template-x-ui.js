import fetchAllTemplatesMetadata from '../../scripts/all-templates-metadata.js';
import {
  createTag,
  fetchPlaceholders,
  getConfig,
  getIconElement,
  getMetadata,
  sampleRUM,
  titleCase,
  transformLinkToAnimation,
} from '../../scripts/utils.js';
import {
  redrawTemplates,
  updateOptionsStatus,
} from './core.js';
import { fetchTemplatesCategoryCount } from './template-search-api-v3.js';

function wordStartsWithVowels(word) {
  return word.match('^[aieouâêîôûäëïöüàéèùœAIEOUÂÊÎÔÛÄËÏÖÜÀÉÈÙŒ].*');
}

/*
Filter Sort Code
*/
function updateFilterIcon(block) {
  const functionWrapper = block.querySelectorAll('.function-wrapper');
  const optionsWrapper = block.querySelectorAll('.options-wrapper');

  functionWrapper.forEach((wrap, index) => {
    const iconHolder = wrap.querySelector('.icon-holder');
    const activeOption = optionsWrapper[index].querySelector(
      '.option-button.active',
    );
    if (iconHolder && activeOption) {
      const activeIcon = activeOption.querySelector('.icon');
      if (activeIcon) {
        iconHolder.innerHTML = activeIcon.outerHTML;
      }
    }
  });
}
function updateQuery(functionWrapper, props, option) {
  const paramType = functionWrapper.dataset.param;
  const paramValue = option.dataset.value;

  if (paramType === 'sort') {
    props.sort = paramValue;
  } else {
    const filtersObj = props.filters;

    if (paramType in filtersObj) {
      if (paramValue === 'remove') {
        delete filtersObj[paramType];
      } else {
        filtersObj[paramType] = `${paramValue}`;
      }
    } else if (paramValue !== 'remove') {
      filtersObj[paramType] = `${paramValue}`;
    }

    props.filters = filtersObj;
  }
}

function closeDrawer(toolBar) {
  const drawerBackground = toolBar.querySelector('.drawer-background');
  const drawer = toolBar.querySelector('.filter-drawer-mobile');
  const applyButton = toolBar.querySelector('.apply-filter-button-wrapper');

  drawer.classList.add('retracted');
  drawerBackground.classList.add('transparent');
  applyButton.classList.add('transparent');

  setTimeout(() => {
    drawer.classList.add('hidden');
    drawerBackground.classList.add('hidden');
    applyButton.classList.add('hidden');
  }, 500);
}

async function initFilterSort(block, props, toolBar) {
  const buttons = toolBar.querySelectorAll('.button-wrapper');
  const applyFilterButton = toolBar.querySelector('.apply-filter-button');
  let existingProps = { ...props, filters: { ...props.filters } };

  if (buttons.length > 0) {
    buttons.forEach((button) => {
      const wrapper = button.parentElement;
      const currentOption = wrapper.querySelector('span.current-option');
      const optionsList = button.nextElementSibling;
      const options = optionsList.querySelectorAll('.option-button');

      button.addEventListener(
        'click',
        () => {
          existingProps = { ...props, filters: { ...props.filters } };
          if (!button.classList.contains('in-drawer')) {
            buttons.forEach((b) => {
              if (button !== b) {
                b.parentElement.classList.remove('opened');
              }
            });

            wrapper.classList.toggle('opened');
          }
        },
        { passive: true },
      );

      options.forEach((option) => {
        const updateOptions = () => {
          buttons.forEach((b) => {
            b.parentElement.classList.remove('opened');
          });

          if (currentOption) {
            currentOption.textContent = option.textContent;
          }

          options.forEach((o) => {
            if (option !== o) {
              o.classList.remove('active');
            }
          });
          option.classList.add('active');
        };

        option.addEventListener(
          'click',
          async (e) => {
            e.stopPropagation();
            updateOptions();
            updateQuery(wrapper, props, option);
            updateFilterIcon(block);

            if (!button.classList.contains('in-drawer')) {
              await redrawTemplates(block, existingProps, props, toolBar);
            }
          },
          { passive: true },
        );
      });

      document.addEventListener(
        'click',
        (e) => {
          const { target } = e;
          if (
            target !== wrapper
            && !wrapper.contains(target)
            && !button.classList.contains('in-drawer')
          ) {
            wrapper.classList.remove('opened');
          }
        },
        { passive: true },
      );
    });

    if (applyFilterButton) {
      applyFilterButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await redrawTemplates(block, existingProps, props, toolBar);
        closeDrawer(toolBar);
      });
    }

    // sync current filter & sorting method with toolbar current options
    updateOptionsStatus(block, props, toolBar);
  }
}

/** *
 * Drawer Code
 * */

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

  const fetchCntSpanPromises = [...categories].map((li) => fetchCntSpan(props, li.querySelector('a'), lang));
  const res = await Promise.all(fetchCntSpanPromises);

  // append one by one to gain attention
  for (const { cntSpan, anchor } of res) {
    anchor.append(cntSpan);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 25));
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

export function initDrawer(block, props, toolBar) {
  const filterButton = toolBar.querySelector('.filter-button-mobile-wrapper');
  const drawerBackground = toolBar.querySelector('.drawer-background');
  const drawer = toolBar.querySelector('.filter-drawer-mobile');
  const closeDrawerBtn = toolBar.querySelector('.close-drawer');
  const applyButton = toolBar.querySelector('.apply-filter-button-wrapper');

  const functionWrappers = drawer.querySelectorAll('.function-wrapper');

  let currentFilters;
  filterButton.addEventListener(
    'click',
    () => {
      appendCategoryTemplatesCount(block, props);
    },
    { once: true },
  );
  filterButton.addEventListener(
    'click',
    () => {
      currentFilters = { ...props.filters };
      drawer.classList.remove('hidden');
      drawerBackground.classList.remove('hidden');
      applyButton.classList.remove('hidden');
      updateLottieStatus(block);

      setTimeout(() => {
        drawer.classList.remove('retracted');
        drawerBackground.classList.remove('transparent');
        applyButton.classList.remove('transparent');
        functionWrappers.forEach((wrapper) => {
          const button = wrapper.querySelector('.button-wrapper');
          if (button) {
            button.style.maxHeight = `${button.nextElementSibling.offsetHeight}px`;
          }
        });
      }, 100);
    },
    { passive: true },
  );

  [drawerBackground, closeDrawerBtn].forEach((el) => {
    el.addEventListener(
      'click',
      async () => {
        props.filters = { ...currentFilters };
        closeDrawer(toolBar);
        updateOptionsStatus(block, props, toolBar);
      },
      { passive: true },
    );
  });

  drawer.classList.remove('hidden');
  functionWrappers.forEach((wrapper) => {
    const button = wrapper.querySelector('.button-wrapper');
    let maxHeight;
    if (button) {
      const wrapperMaxHeightGrabbed = setInterval(() => {
        if (wrapper.offsetHeight > 0) {
          maxHeight = `${wrapper.offsetHeight}px`;
          wrapper.style.maxHeight = maxHeight;
          clearInterval(wrapperMaxHeightGrabbed);
        }
      }, 200);

      button.addEventListener(
        'click',
        (e) => {
          e.stopPropagation();
          const btnWrapper = wrapper.querySelector('.button-wrapper');
          if (btnWrapper) {
            const minHeight = `${btnWrapper.offsetHeight - 8}px`;
            wrapper.classList.toggle('collapsed');
            wrapper.style.maxHeight = wrapper.classList.contains('collapsed')
              ? minHeight
              : maxHeight;
          }
        },
        { passive: true },
      );
    }
  });

  drawer.classList.add('hidden');
}

function initToolbarShadow(block, toolbar) {
  const toolbarWrapper = toolbar.parentElement;
  document.addEventListener('scroll', () => {
    if (toolbarWrapper.getBoundingClientRect().top <= 0) {
      toolbarWrapper.classList.add('with-box-shadow');
    } else {
      toolbarWrapper.classList.remove('with-box-shadow');
    }
  });
}

async function formatHeadingPlaceholder(props) {
  // special treatment for express/ root url
  const placeholders = await fetchPlaceholders();
  const config = getConfig();
  const { region } = config.locale;
  const lang = config.locale.ietf;
  const templateCount = lang === 'es-ES'
    ? props.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    : props.total.toLocaleString(lang);
  let toolBarHeading = getMetadata('toolbar-heading')
    ? props.templateStats
    : placeholders['template-placeholder'];

  if (
    getMetadata('template-search-page') === 'Y'
    && placeholders['template-search-heading-singular']
    && placeholders['template-search-heading-plural']
  ) {
    toolBarHeading = props.total === 1
      ? placeholders['template-search-heading-singular']
      : placeholders['template-search-heading-plural'];
  }

  if (toolBarHeading) {
    toolBarHeading = toolBarHeading
      .replace('{{quantity}}', props.fallbackMsg ? '0' : templateCount)
      .replace(
        '{{Type}}',
        titleCase(
          getMetadata('short-title')
            || getMetadata('q')
            || getMetadata('topics'),
        ),
      )
      .replace(
        '{{type}}',
        getMetadata('short-title') || getMetadata('q') || getMetadata('topics'),
      );
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

function makeTemplateFunctions(placeholders) {
  const functions = {
    premium: {
      placeholders: JSON.parse(placeholders['template-filter-premium'] ?? '{}'),
      elements: {},
      icons: placeholders['template-filter-premium-icons']
        ?.replace(/\s/g, '')
        ?.split(',') || [
        'template-premium-and-free',
        'template-free',
        'template-premium',
      ],
    },
    animated: {
      placeholders: JSON.parse(
        placeholders['template-filter-animated'] ?? '{}',
      ),
      elements: {},
      icons: placeholders['template-filter-animated-icons']
        ?.replace(/\s/g, '')
        ?.split(',') || [
        'template-static-and-animated',
        'template-static',
        'template-animated',
      ],
    },
    sort: {
      placeholders: JSON.parse(placeholders['template-x-sort'] ?? '{}'),
      elements: {},
      icons: placeholders['template-x-sort-icons']
        ?.replace(/\s/g, '')
        ?.split(',') || [
        'sort',
        'visibility-on',
        'visibility-off',
        'order-dsc',
        'order-asc',
      ],
    },
  };

  Object.entries(functions).forEach((entry) => {
    entry[1].elements.wrapper = createTag('div', {
      class: `function-wrapper function-${entry[0]}`,
      'data-param': entry[0],
    });

    entry[1].elements.wrapper.subElements = {
      button: {
        wrapper: createTag('div', {
          class: `button-wrapper button-wrapper-${entry[0]}`,
        }),
        subElements: {
          iconHolder: createTag('span', { class: 'icon-holder' }),
          textSpan: createTag('span', {
            class: `current-option current-option-${entry[0]}`,
          }),
          chevIcon: getIconElement('drop-down-arrow'),
        },
      },
      options: {
        wrapper: createTag('div', {
          class: `options-wrapper options-wrapper-${entry[0]}`,
        }),
        subElements: Object.entries(entry[1].placeholders).map(
          (option, subIndex) => {
            const icon = getIconElement(entry[1].icons[subIndex]);
            const optionButton = createTag('div', {
              class: 'option-button',
              'data-value': option[1],
            });
            [optionButton.textContent] = option;
            optionButton.prepend(icon);
            return optionButton;
          },
        ),
      },
    };

    const $span = entry[1].elements.wrapper.subElements.button.subElements.textSpan;
    [[$span.textContent]] = Object.entries(entry[1].placeholders);
  });

  return functions;
}

function decorateFunctionsContainer(block, functions, placeholders) {
  const functionsContainer = createTag('div', { class: 'functions-container' });
  const functionContainerMobile = createTag('div', {
    class: 'functions-drawer',
  });

  Object.values(functions).forEach((filter) => {
    const filterWrapper = filter.elements.wrapper;

    Object.values(filterWrapper.subElements).forEach((part) => {
      const innerWrapper = part.wrapper;

      Object.values(part.subElements).forEach((innerElement) => {
        if (innerElement) {
          innerWrapper.append(innerElement);
        }
      });

      filterWrapper.append(innerWrapper);
    });
    functionContainerMobile.append(filterWrapper.cloneNode({ deep: true }));
    functionsContainer.append(filterWrapper);
  });

  // restructure drawer for mobile design
  const filterContainer = createTag('div', {
    class: 'filter-container-mobile',
  });
  const mobileFilterButtonWrapper = createTag('div', {
    class: 'filter-button-mobile-wrapper',
  });
  const mobileFilterButton = createTag('span', {
    class: 'filter-button-mobile',
  });
  const drawer = createTag('div', {
    class: 'filter-drawer-mobile hidden retracted',
  });
  const drawerInnerWrapper = createTag('div', {
    class: 'filter-drawer-mobile-inner-wrapper',
  });
  const drawerBackground = createTag('div', {
    class: 'drawer-background hidden transparent',
  });
  const $closeButton = getIconElement('search-clear');
  const applyButtonWrapper = createTag('div', {
    class: 'apply-filter-button-wrapper hidden transparent',
  });
  const applyButton = createTag('a', {
    class: 'apply-filter-button button gradient',
    href: '#',
  });

  $closeButton.classList.add('close-drawer');
  applyButton.textContent = placeholders['apply-filters'];

  functionContainerMobile.children[0].querySelector(
    '.current-option-premium',
  ).textContent = `${placeholders.free} ${placeholders['versus-shorthand']} ${placeholders.premium}`;

  functionContainerMobile.children[1].querySelector(
    '.current-option-animated',
  ).textContent = `${placeholders.static} ${placeholders['versus-shorthand']} ${placeholders.animated}`;

  drawerInnerWrapper.append(
    functionContainerMobile.children[0],
    functionContainerMobile.children[1],
  );

  drawer.append($closeButton, drawerInnerWrapper);

  const buttonsInDrawer = drawer.querySelectorAll('.button-wrapper');
  const optionsInDrawer = drawer.querySelectorAll('.options-wrapper');

  [buttonsInDrawer, optionsInDrawer].forEach((category) => {
    category.forEach((element) => {
      element.classList.add('in-drawer');
      const heading = element.querySelector('.current-option');
      const iconHolder = element.querySelector('.icon-holder');
      if (heading) {
        heading.className = 'filter-mobile-option-heading';
      }
      if (iconHolder) {
        iconHolder.remove();
      }
    });
  });

  mobileFilterButtonWrapper.append(
    getIconElement('scratch-icon-22'),
    mobileFilterButton,
  );
  applyButtonWrapper.append(applyButton);
  filterContainer.append(
    mobileFilterButtonWrapper,
    drawer,
    applyButtonWrapper,
    drawerBackground,
  );
  functionContainerMobile.prepend(filterContainer);

  mobileFilterButton.textContent = placeholders.filter;
  const sortButton = functionContainerMobile.querySelector(
    '.current-option-sort',
  );
  if (sortButton) {
    sortButton.textContent = placeholders.sort;
    sortButton.className = 'filter-mobile-option-heading';
  }

  return { mobile: functionContainerMobile, desktop: functionsContainer };
}

function initExpandCollapseToolbar(block, templateTitle, toggle, link) {
  const onToggle = () => {
    block.classList.toggle('expanded');

    if (
      document.body.dataset.device === 'mobile'
      || block.classList.contains('mobile')
    ) {
      const tglBtn = block.querySelector('.toggle-button');
      const heading = templateTitle.querySelector('.toggle-bar-top > h4');

      if (tglBtn && heading) {
        const rect = heading.getBoundingClientRect();
        if (!block.classList.contains('expanded')) {
          tglBtn.style.marginLeft = `${rect.x}px`;
        } else {
          tglBtn.style.removeProperty('margin-left');
        }
      }
    }
  };

  const chev = block.querySelector('.toggle-button-chev');
  templateTitle.addEventListener('click', () => onToggle());
  chev.addEventListener('click', (e) => {
    e.stopPropagation();
    onToggle();
  });

  toggle.addEventListener('click', () => onToggle());
  link.addEventListener('click', (e) => e.stopPropagation());

  setTimeout(() => {
    if (!block.matches(':hover')) {
      onToggle();
    }
  }, 3000);
}

export function decorateHoliday(block, props) {
  const main = document.querySelector('main');
  const templateXSection = block.closest(
    'div[class="section section-wrapper template-x-container"]',
  );
  const mobileViewport = window.innerWidth < 901;
  const templateTitle = block.querySelector('.template-title');
  const toggleBar = templateTitle.querySelector('div');
  const heading = templateTitle.querySelector('h4');
  const subheading = templateTitle.querySelector('p');
  const link = templateTitle.querySelector('.template-title-link');
  const linkWrapper = link.closest('p');
  const toggle = createTag('div', { class: 'toggle-button' });
  const topElements = createTag('div', { class: 'toggle-bar-top' });
  const bottomElements = createTag('div', { class: 'toggle-bar-bottom' });
  const toggleChev = createTag('div', { class: 'toggle-button-chev' });

  if (props.holidayIcon) topElements.append(props.holidayIcon);
  if (props.backgroundAnimation) {
    const animation = transformLinkToAnimation(props.backgroundAnimation);
    block.classList.add('animated');
    block.prepend(animation);
  }

  if (
    templateXSection
    && templateXSection.querySelectorAll('div.block').length === 1
  ) main.classList.add('with-holiday-templates-banner');
  block.classList.add('expanded', props.textColor);
  toggleBar.classList.add('toggle-bar');
  topElements.append(heading);
  toggle.append(link, toggleChev);
  linkWrapper.remove();
  bottomElements.append(subheading);
  toggleBar.append(topElements, bottomElements);
  block.style.backgroundColor = props.backgroundColor;

  if (mobileViewport) {
    block.classList.add('mobile');
    block.append(toggle);
  } else {
    toggleBar.append(toggle);
  }

  initExpandCollapseToolbar(block, templateTitle, toggle, link);
}

function handlelize(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/(\W+|\s+)/g, '-') // Replace space and other characters by hyphen
    .replace(/--+/g, '-') // Replaces multiple hyphens by one hyphen
    .replace(/(^-+|-+$)/g, '') // Remove extra hyphens from beginning or end of the string
    .toLowerCase(); // To lowercase
}
function cycleThroughSuggestions(block, targetIndex = 0) {
  const suggestions = block.querySelectorAll('.suggestions-list li');
  if (targetIndex >= suggestions.length || targetIndex < 0) return;
  if (suggestions.length > 0) suggestions[targetIndex].focus();
}

export function importSearchBar(block, blockMediator) {
  blockMediator.subscribe('stickySearchBar', (e) => {
    const parent = block.querySelector(
      '.api-templates-toolbar .wrapper-content-search',
    );
    if (parent) {
      const existingStickySearchBar = parent.querySelector(
        '.search-bar-wrapper',
      );
      if (e.newValue.loadSearchBar && !existingStickySearchBar) {
        const searchWrapper = e.newValue.element;
        parent.prepend(searchWrapper);
        searchWrapper.classList.add('show');
        searchWrapper.classList.add('collapsed');

        const searchDropdown = searchWrapper.querySelector(
          '.search-dropdown-container',
        );
        const searchForm = searchWrapper.querySelector('.search-form');
        const searchBar = searchWrapper.querySelector('input.search-bar');
        const clearBtn = searchWrapper.querySelector('.icon-search-clear');
        const trendsContainer = searchWrapper.querySelector('.trends-container');
        const suggestionsContainer = searchWrapper.querySelector(
          '.suggestions-container',
        );
        const suggestionsList = searchWrapper.querySelector('.suggestions-list');

        searchBar.addEventListener(
          'click',
          (event) => {
            event.stopPropagation();
            searchWrapper.classList.remove('collapsed');
            setTimeout(() => {
              searchDropdown.classList.remove('hidden');
            }, 500);
          },
          { passive: true },
        );

        searchBar.addEventListener(
          'keyup',
          () => {
            if (searchBar.value !== '') {
              clearBtn.style.display = 'inline-block';
              trendsContainer.classList.add('hidden');
              suggestionsContainer.classList.remove('hidden');
            } else {
              clearBtn.style.display = 'none';
              trendsContainer.classList.remove('hidden');
              suggestionsContainer.classList.add('hidden');
            }
          },
          { passive: true },
        );

        searchBar.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowDown' || event.keyCode === 40) {
            event.preventDefault();
            cycleThroughSuggestions(block);
          }
        });

        document.addEventListener(
          'click',
          (event) => {
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
          },
          { passive: true },
        );

        const redirectSearch = async () => {
          const placeholders = await fetchPlaceholders();
          const taskMap = placeholders['x-task-name-mapping']
            ? JSON.parse(placeholders['task-name-mapping'])
            : {};

          const format = getMetadata('placeholder-format');
          let currentTasks = '';
          let searchInput = searchBar.value.toLowerCase() || getMetadata('topics');

          const tasksFoundInInput = Object.entries(taskMap)
            .filter((task) => task[1].some((word) => {
              const searchValue = searchBar.value.toLowerCase();
              return searchValue.indexOf(word.toLowerCase()) >= 0;
            }))
            .sort((a, b) => b[0].length - a[0].length);

          if (tasksFoundInInput.length > 0) {
            tasksFoundInInput[0][1]
              .sort((a, b) => b.length - a.length)
              .forEach((word) => {
                searchInput = searchInput
                  .toLowerCase()
                  .replace(word.toLowerCase(), '');
              });

            searchInput = searchInput.trim();
            [[currentTasks]] = tasksFoundInInput;
          }

          const { prefix } = getConfig().locale;
          const topicUrl = searchInput ? `/${searchInput}` : '';
          const taskUrl = `/${handlelize(currentTasks.toLowerCase())}`;
          const targetPath = `${prefix}/express/templates${taskUrl}${topicUrl}`;
          const allTemplatesMetadata = await fetchAllTemplatesMetadata();
          const pathMatch = (event) => event.url === targetPath;
          if (allTemplatesMetadata.some(pathMatch)) {
            window.location = `${window.location.origin}${targetPath}`;
          } else {
            const searchUrlTemplate = `/express/templates/search?tasks=${currentTasks}&phformat=${format}&topics=${
              searchInput || "''"
            }&q=${searchInput || "''"}`;
            window.location = `${window.location.origin}${prefix}${searchUrlTemplate}`;
          }
        };

        const onSearchSubmit = async () => {
          searchBar.disabled = true;
          sampleRUM(
            'search',
            {
              source: block.dataset.blockName,
              target: searchBar.value,
            },
            1,
          );
          await redirectSearch();
        };

        const handleSubmitInteraction = async (item) => {
          if (item.query !== searchBar.value) {
            searchBar.value = item.query;
            searchBar.dispatchEvent(new Event('input'));
          }
          await onSearchSubmit();
        };

        searchForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          searchBar.disabled = true;
          sampleRUM(
            'search',
            {
              source: block.dataset.blockName,
              target: searchBar.value,
            },
            1,
          );
          await redirectSearch();
        });

        clearBtn.addEventListener(
          'click',
          () => {
            searchBar.value = '';
            suggestionsList.innerHTML = '';
            trendsContainer.classList.remove('hidden');
            suggestionsContainer.classList.add('hidden');
            clearBtn.style.display = 'none';
          },
          { passive: true },
        );

        const suggestionsListUIUpdateCB = (suggestions) => {
          suggestionsList.innerHTML = '';
          const searchBarVal = searchBar.value.toLowerCase();
          if (
            suggestions
            && !(suggestions.length <= 1 && suggestions[0]?.query === searchBarVal)
          ) {
            suggestions.forEach((item, index) => {
              const li = createTag('li', { tabindex: 0 });
              const valRegEx = new RegExp(searchBar.value, 'i');
              li.innerHTML = item.query.replace(
                valRegEx,
                `<b>${searchBarVal}</b>`,
              );
              li.addEventListener('click', async () => {
                await handleSubmitInteraction(item);
              });

              li.addEventListener('keydown', async (event) => {
                if (event.key === 'Enter' || event.keyCode === 13) {
                  await handleSubmitInteraction(item);
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
          }
        };

        import('../../scripts/autocomplete-api-v3.js').then(
          ({ default: useInputAutocomplete }) => {
            const { inputHandler } = useInputAutocomplete(
              suggestionsListUIUpdateCB,
              { throttleDelay: 300, debounceDelay: 500, limit: 7 },
            );
            searchBar.addEventListener('input', inputHandler);
          },
        );
      }

      if (e.newValue.loadSearchBar && existingStickySearchBar) {
        existingStickySearchBar.classList.add('show');
      }

      if (!e.newValue.loadSearchBar && existingStickySearchBar) {
        existingStickySearchBar.classList.remove('show');
      }
    }
  });
}
function getPlaceholderWidth(block) {
  let width;
  if (window.innerWidth >= 900) {
    if (block.classList.contains('sm-view')) {
      width = 165;
    }

    if (block.classList.contains('md-view')) {
      width = 258.5;
    }

    if (block.classList.contains('lg-view')) {
      width = 352;
    }
  } else if (window.innerWidth >= 600) {
    if (block.classList.contains('sm-view')) {
      width = 165;
    }

    if (block.classList.contains('md-view')) {
      width = 227.33;
    }

    if (block.classList.contains('lg-view')) {
      width = 352;
    }
  } else {
    if (block.classList.contains('sm-view')) {
      width = 106.33;
    }

    if (block.classList.contains('md-view')) {
      width = 165.5;
    }

    if (block.classList.contains('lg-view')) {
      width = 335;
    }
  }

  return width;
}

function toggleMasonryView(block, props, button, toggleButtons) {
  const templatesToView = block.querySelectorAll('.template:not(.placeholder)');
  const blockWrapper = block.closest('.template-x-wrapper');

  if (!button.classList.contains('active') && templatesToView.length > 0) {
    toggleButtons.forEach((b) => {
      if (b !== button) {
        b.classList.remove('active');
      }
    });

    ['sm-view', 'md-view', 'lg-view'].forEach((className) => {
      if (className !== `${button.dataset.view}-view`) {
        block.classList.remove(className);
        blockWrapper.classList.remove(className);
      }
    });
    button.classList.add('active');
    block.classList.add(`${button.dataset.view}-view`);
    blockWrapper.classList.add(`${button.dataset.view}-view`);

    props.masonry.draw();
  }

  const placeholder = block.querySelector('.template.placeholder');
  const ratios = props.placeholderFormat;
  const width = getPlaceholderWidth(block);

  if (ratios[1]) {
    const height = (ratios[1] / ratios[0]) * width;
    placeholder.style = `height: ${height - 21}px`;
    if (width / height > 1.3) {
      placeholder.classList.add('wide');
    }
  }
}

function initViewToggle(block, props, toolBar) {
  const toggleButtons = toolBar.querySelectorAll('.view-toggle-button ');
  const authoredViewIndex = ['sm', 'md', 'lg'].findIndex(
    (size) => getMetadata('initial-template-view')?.toLowerCase().trim() === size,
  );
  const initViewIndex = authoredViewIndex === -1 ? 0 : authoredViewIndex;

  toggleButtons.forEach((button, index) => {
    if (index === initViewIndex) {
      toggleMasonryView(block, props, button, toggleButtons);
    }

    button.addEventListener(
      'click',
      () => {
        toggleMasonryView(block, props, button, toggleButtons);
      },
      { passive: true },
    );
  });
}
export async function decorateToolbar(block, props) {
  const placeholders = await fetchPlaceholders();
  const sectionHeading = createTag('h2');
  const tBarWrapper = createTag('div', { class: 'toolbar-wrapper' });
  const tBar = createTag('div', { class: 'api-templates-toolbar' });
  const contentWrapper = createTag('div', { class: 'wrapper-content-search' });
  const functionsWrapper = createTag('div', { class: 'wrapper-functions' });

  if (props.templateStats) {
    sectionHeading.textContent = (await formatHeadingPlaceholder(props)) || '';
  }

  block.prepend(tBarWrapper);
  tBarWrapper.append(tBar);
  tBar.append(contentWrapper, functionsWrapper);
  contentWrapper.append(sectionHeading);

  if (tBar) {
    const viewsWrapper = createTag('div', { class: 'views' });

    const smView = createTag('a', {
      class: 'view-toggle-button small-view',
      'data-view': 'sm',
    });
    smView.append(getIconElement('small_grid'));
    const mdView = createTag('a', {
      class: 'view-toggle-button medium-view',
      'data-view': 'md',
    });
    mdView.append(getIconElement('medium_grid'));
    const lgView = createTag('a', {
      class: 'view-toggle-button large-view',
      'data-view': 'lg',
    });
    lgView.append(getIconElement('large_grid'));

    const functionsObj = makeTemplateFunctions(placeholders);
    const functions = decorateFunctionsContainer(
      block,
      functionsObj,
      placeholders,
    );

    viewsWrapper.append(smView, mdView, lgView);
    functionsWrapper.append(viewsWrapper, functions.desktop);

    tBar.append(contentWrapper, functionsWrapper, functions.mobile);

    initDrawer(block, props, tBar);
    initFilterSort(block, props, tBar);
    initViewToggle(block, props, tBar);
    initToolbarShadow(block, tBar);
  }
}
