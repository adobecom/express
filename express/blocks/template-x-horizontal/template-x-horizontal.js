import { addTempWrapper } from '../../scripts/decorate.js';
import {
  createOptimizedPicture,
  createTag,
  fetchPlaceholders,
  getConfig,
} from '../../scripts/utils.js';
import buildCarousel from '../shared/carousel.js';

import {
  fetchAndRenderTemplates, populateTemplates, decorateBreadcrumbs
} from '../template-x/core.js';

import {
  decorateHoliday,
} from '../template-x/template-x-holiday-banner.js';

/*
  Template X Horizontal. Assumes a single row of templates.
*/

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
  templateTitle.classList.add('horizontal');
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
    [props.contentRow] = cols;
  });

  return props;
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

async function decorateTemplates(block, props) {
  const innerWrapper = block.querySelector('.template-x-inner-wrapper');
  const templates = Array.from(innerWrapper.children);

  let breakpoints = [{ width: '400' }];
  block.classList.add('large');
  breakpoints = [
    {
      media: '(min-width: 600px)',
      width: '2000',
    },
    { width: '750' },
  ];
  
  block.querySelectorAll(':scope picture > img').forEach((img) => {
    const { src, alt } = img;
    img.parentNode.replaceWith(
      createOptimizedPicture(src, alt, true, breakpoints),
    );
  });
  populateTemplates(block, props, templates);
  await attachFreeInAppPills(block);
  const templateLinks = block.querySelectorAll(
    '.template .button-container > a, a.template.placeholder',
  );
  const linksPopulated = new CustomEvent('linkspopulated', {
    detail: templateLinks,
  });
  document.dispatchEvent(linksPopulated);
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

async function buildTemplateList(block, props) {
  await processContentRow(block, props);
  const { templates, fallbackMsg } = await fetchAndRenderTemplates(props);

  if (templates?.length > 0) {
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
  } else {
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

  await decorateBreadcrumbs(block);

  const innerWrapper = block.querySelector('.template-x-inner-wrapper');
  if (innerWrapper) {
    buildCarousel(':scope > .template', innerWrapper);
  }

  if (props.holidayBlock) {
    decorateHoliday(block, props);
  }
}

function determineTemplateXType(props) {
  // todo: build layers of aspects based on props conditions - i.e. orientation -> style -> use case
  const type = [];

  // orientation aspect
  type.push('horizontal');
  if (props.mini) type.push('mini');
  // use case aspect
  if (props.holidayBlock) type.push('holiday');
  return type;
}

export default async function decorate(block) {
  addTempWrapper(block, 'template-x');
  const props = constructProps(block);
  block.innerHTML = '';
  await buildTemplateList(block, props);
}
