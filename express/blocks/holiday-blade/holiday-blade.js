import {
  createTag, fetchPlaceholders, createOptimizedPicture, transformLinkToAnimation,
} from '../../scripts/utils.js';

const BATCH_LIMIT = 5;

function attachToggleControls(block, toggleChev) {
  const onToggle = (e) => {
    e.stopPropagation();
    if (e.target.closest('.carousel-fader-right') || e.target.closest('.carousel-fader-left') || e.target.closest('.carousel-container')) {
      return;
    }
    block.classList.toggle('expanded');
  };

  const onOutsideToggle = (e) => {
    e.stopPropagation();
    if (e.target.closest('.carousel-fader-right') || e.target.closest('.carousel-fader-left') || e.target.closest('.carousel-container')) {
      return;
    }
    if (
      block.classList.contains('expanded')
    ) {
      block.classList.toggle('expanded');
    }
  };
  const templateImages = block.querySelectorAll('.template');

  templateImages.forEach((template) => {
    template.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  toggleChev.addEventListener('click', onToggle);
  block.querySelector('.toggle-bar').addEventListener('click', onToggle);
  document.addEventListener('click', onOutsideToggle);

  setTimeout(() => {
    if (block.classList.contains('auto-expand')) {
      onToggle();
    }
  }, 3000);
}

function decorateTemplates(innerWrapper) {
  const templates = innerWrapper.children;
  innerWrapper.querySelectorAll(':scope picture > img').forEach((img) => {
    const { src, alt } = img;
    img.parentNode.replaceWith(createOptimizedPicture(src, alt, true, [{ width: '400' }]));
  });

  for (const tmplt of templates) {
    tmplt.classList.add('template');
  }
}

async function loadTemplatesPromise(props, innerWrapper, placeholders,
  getTemplates, fetchTemplates,  start, total) {
  innerWrapper.classList.add('loading-templates');
  const { response, fallbackMsg } = await fetchTemplates({
    ...props, start, limit: Math.min(BATCH_LIMIT, total - start),
  });
  if (!response || !response.items || !Array.isArray(response.items)) {
    throw new Error('Invalid template response format');
  }
  const { templates } = await getTemplates(response, placeholders, fallbackMsg);
  const fragment = document.createDocumentFragment();
  templates.forEach((template) => {
    fragment.appendChild(template);
  });
  innerWrapper.appendChild(fragment);
  await decorateTemplates(innerWrapper );
  innerWrapper.classList.remove('loading-templates');
}

async function fetchAndRenderTemplates(block, props, toggleChev) {
  const [
    { default: renderTemplate },
    { isValidTemplate, fetchTemplates },
    { default: buildCarousel },
  ] = await Promise.all([
    import('../template-x/template-rendering.js'),
    import('../../scripts/template-search-api-v3.js'),
    import('../shared/carousel.js'),
  ]);
  const placeholders = await fetchPlaceholders();

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

  const rows = block.children;
  for (let i = 1; i < 4; i += 1) {
    rows[i].innerHTML = '';
  }
  const innerWrapper = createTag('div', { class: 'holiday-blade-inner-wrapper' });
  rows[0].classList.add('content-loaded');

  const p = [];
  for (let i = 0; i < props.total_limit / BATCH_LIMIT; i += 1) {
    p.push(loadTemplatesPromise(props, innerWrapper,
      placeholders, getTemplates, fetchTemplates, i * BATCH_LIMIT, props.total_limit));
  }
  await Promise.all(p);
  buildCarousel(':scope > .template', innerWrapper);
  rows[1].appendChild(innerWrapper);
  attachToggleControls(block, toggleChev);
  setTimeout(() => {
    rows[1].classList.add('content-loaded');
  }, 100);
}

async function decorateHoliday(block, props) {
  const rows = block.children;
  const toggleBar = rows[0].children[0];
  toggleBar.classList.add('toggle-bar');
  const toggleChev = createTag('div', { class: 'toggle-button-chev' });
  toggleBar.append(toggleChev);
  const animation = transformLinkToAnimation(rows[0].children[1].querySelector('a'));
  block.classList.add('animated');
  block.append(animation);
  fetchAndRenderTemplates(block, props, toggleChev);
}

export default function decorate(block) {
  const rows = block.children;
  const toggleBar = rows[0].children[0];

  toggleBar.classList.add('toggle-bar');
  const locale = rows[1].children[1].textContent;
  const collectionId = rows[2].children[1].textContent;
  const props = {
    templates: [],
    filters: {
      locales: locale,
      topics: '',
      behaviors: 'still',
      premium: 'False',
    },
    orientation: 'horizontal',
    renditionParams: {
      format: 'jpg',
      size: 151,
    },
    collectionId,
    total_limit: rows[3]?.children[1].textContent,
    limit: BATCH_LIMIT,
  };
  decorateHoliday(block, props);
}
