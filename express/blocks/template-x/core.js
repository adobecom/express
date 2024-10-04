import {
  createTag,
  fetchPlaceholders,
  getIconElement,
  toClassName,
} from '../../scripts/utils.js';
import renderSingleTemplate from './render-single-template.js';
import { fetchTemplates, isValidTemplate, trackSearch } from '../../scripts/template-search-api-v3.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

export function updateLoadMoreButton(props, loadMore) {
  if (props.start === '') {
    loadMore.style.display = 'none';
  } else {
    loadMore.style.removeProperty('display');
  }
}

export async function decorateLoadMoreButton(block, props) {
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
  updateLoadMoreButton(props, loadMoreButton);
}

async function getTemplates(response, phs, fallbackMsg) {
  const filtered = response.items.filter((item) => isValidTemplate(item));
  const templates = await Promise.all(
    filtered.map((template) => renderSingleTemplate(template, phs)),
  );
  return {
    fallbackMsg,
    templates,
  };
}

export async function fetchAndRenderTemplates(props) {
  const [placeholders, { response, fallbackMsg }] = await Promise.all([
    fetchPlaceholders(),
    fetchTemplates(props),
  ]);
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
  console.log(props);
  // eslint-disable-next-line no-return-await
  return await getTemplates(response, placeholders, fallbackMsg);
}

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

export function updateOptionsStatus(block, props, toolBar) {
  const wrappers = toolBar.querySelectorAll('.function-wrapper');
  const waysOfSort = {
    'Most Relevant': '',
    'Most Viewed': '&orderBy=-remixCount',
    'Rare & Original': '&orderBy=remixCount',
    'Newest to Oldest': '&orderBy=-availabilityDate',
    'Oldest to Newest': '&orderBy=availabilityDate',
  };

  wrappers.forEach((wrapper) => {
    const currentOption = wrapper.querySelector('.current-option');
    const options = wrapper.querySelectorAll('.option-button');

    options.forEach((option) => {
      const paramType = wrapper.dataset.param;
      const paramValue = option.dataset.value;
      const filterValue = props.filters[paramType]
        ? props.filters[paramType]
        : 'remove';
      const sortValue = waysOfSort[props[paramType]] || props[paramType];

      if (filterValue === paramValue || sortValue === paramValue) {
        if (currentOption) {
          currentOption.textContent = option.textContent;
        }

        options.forEach((o) => {
          if (option !== o) {
            o.classList.remove('active');
          }
        });

        option.classList.add('active');
      }
    });

    updateFilterIcon(block);
  });
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
    const width = block.classList.contains('sixcols')
      || block.classList.contains('fullwidth')
      ? 165
      : 200;
    const height = (ratios[1] / ratios[0]) * width;
    tmplt.style.height = `${height}px`;
    if (height < SHORT_PLACEHOLDER_HEIGHT_CUTOFF) tmplt.classList.add('short');
    if (width / height > WIDE_PLACEHOLDER_RATIO_CUTOFF) {
      tmplt.classList.add('wide');
    }
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

export function populateTemplates(block, props, templates) {
  for (let tmplt of templates) {
    const isPlaceholder = tmplt.querySelector(
      ':scope > div:first-of-type > img[src*=".svg"], :scope > div:first-of-type > svg',
    );
    const linkContainer = tmplt.querySelector(':scope > div:nth-of-type(2)');
    const rowWithLinkInFirstCol = tmplt.querySelector(
      ':scope > div:first-of-type > a',
    );
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

export async function decorateNewTemplates(
  block,
  props,
  options = { reDrawMasonry: false },
) {
  const { templates: newTemplates } = await fetchAndRenderTemplates(props);
  const loadMore = block.parentElement.querySelector('.load-more');

  props.templates = props.templates.concat(newTemplates);
  populateTemplates(block, props, newTemplates);

  const newCells = Array.from(block.querySelectorAll('.template:not(.appear)'));

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

export async function redrawTemplates(block, existingProps, props, toolBar) {
  if (JSON.stringify(props) === JSON.stringify(existingProps)) return;
  const heading = toolBar.querySelector('h2');
  const currentTotal = props.total.toLocaleString('en-US');
  props.templates = [props.templates[0]];
  props.start = '';
  block.querySelectorAll('.template:not(.placeholder)').forEach((card) => {
    card.remove();
  });

  await decorateNewTemplates(block, props, { reDrawMasonry: true });

  heading.textContent = heading.textContent.replace(`${currentTotal}`, props.total.toLocaleString('en-US'));
  updateOptionsStatus(block, props, toolBar);
  if (block.querySelectorAll('.template').length <= 0) {
    const $viewButtons = toolBar.querySelectorAll('.view-toggle-button');
    $viewButtons.forEach((button) => {
      button.classList.remove('active');
    });
    ['sm-view', 'md-view', 'lg-view'].forEach((className) => {
      block.classList.remove(className);
    });
  }
}

export async function decorateBreadcrumbs(block) {
  // breadcrumbs are desktop-only
  if (document.body.dataset.device !== 'desktop') return;
  const { default: getBreadcrumbs } = await import('./breadcrumbs.js');
  const breadcrumbs = await getBreadcrumbs();
  if (breadcrumbs) block.prepend(breadcrumbs);
}
