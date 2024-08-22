import {
  fetchPlaceholders,
  getConfig,
  getMetadata,
  titleCase,
  yieldToMain,
} from './utils.js';
import HtmlSanitizer from './html-sanitizer.js';

async function replaceDefaultPlaceholders(block, components) {
  block.innerHTML = block.innerHTML.replaceAll('https://www.adobe.com/express/templates/default-create-link', components.link);

  if (components.tasks === '') {
    const placeholders = await fetchPlaceholders();
    block.innerHTML = block.innerHTML.replaceAll('default-create-link-text', placeholders['start-from-scratch'] || '');
  } else {
    block.innerHTML = block.innerHTML.replaceAll('default-create-link-text', getMetadata('create-text') || '');
  }
}

async function getReplacementsFromSearch() {
  // FIXME: tasks and tasksx split to be removed after mobile GA
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const {
    tasks,
    tasksx,
    phformat,
    topics,
    q,
  } = params;
  if (!tasks && !phformat) {
    return null;
  }
  const placeholders = await fetchPlaceholders();
  const categories = JSON.parse(placeholders['task-categories']);
  const xCategories = JSON.parse(placeholders['x-task-categories']);
  if (!categories) {
    return null;
  }

  const exp = /['"<>?.;{}]/gm;
  const sanitizedTasks = tasks?.match(exp) ? '' : tasks;
  const sanitizedTasksx = tasksx?.match(exp) ? '' : tasksx;
  const sanitizedTopics = topics?.match(exp) ? '' : topics;
  const sanitizedQuery = q?.match(exp) ? '' : q;

  const tasksPair = Object.entries(categories).find((cat) => cat[1] === sanitizedTasks);
  const xTasksPair = Object.entries(xCategories).find((cat) => cat[1] === sanitizedTasksx);

  let translatedTasks = xTasksPair?.[1] ? xTasksPair[0].toLowerCase() : sanitizedTasksx;
  if (!translatedTasks) {
    translatedTasks = tasksPair?.[1] ? tasksPair[0].toLowerCase() : sanitizedTasks;
  }
  return {
    '{{queryTasks}}': sanitizedTasks || '',
    '{{QueryTasks}}': titleCase(sanitizedTasks || ''),
    '{{queryTasksX}}': sanitizedTasksx || '',
    '{{translatedTasks}}': translatedTasks || '',
    '{{TranslatedTasks}}': titleCase(translatedTasks || ''),
    '{{placeholderRatio}}': phformat || '',
    '{{QueryTopics}}': titleCase(sanitizedTopics || ''),
    '{{queryTopics}}': sanitizedTopics || '',
    '{{query}}': sanitizedQuery || '',
  };
}

const bladeRegex = /\{\{[a-zA-Z_-]+\}\}/g;
function replaceBladesInStr(str, replacements) {
  if (!replacements) return str;
  return str.replaceAll(bladeRegex, (match) => {
    if (match in replacements) {
      return replacements[match];
    }
    return match;
  });
}

async function updateMetadataForTemplates() {
  if (!['yes', 'true', 'on', 'Y'].includes(getMetadata('template-search-page'))) {
    return;
  }
  const head = document.querySelector('head');
  if (head) {
    const replacements = await getReplacementsFromSearch();
    if (!replacements) return;
    const title = head.getElementsByTagName('title')[0];
    title.innerText = replaceBladesInStr(title.innerText, replacements);
    [...head.getElementsByTagName('meta')].forEach((meta) => {
      meta.setAttribute('content', replaceBladesInStr(meta.getAttribute('content'), replacements));
    });
  }
}

const ignoredMeta = [
  'serp-content-type',
  'description',
  'primaryproductname',
  'theme',
  'show-free-plan',
  'sheet-powered',
  'viewport',
];

async function sanitizeMeta(meta) {
  if (meta.property || meta.name.includes(':') || ignoredMeta.includes(meta.name)) return;
  await yieldToMain();
  meta.content = HtmlSanitizer.SanitizeHtml(meta.content);
}

// metadata -> dom blades
async function autoUpdatePage(main) {
  const wl = ['{{heading_placeholder}}', '{{type}}', '{{quantity}}'];
  // FIXME: deprecate wl
  if (!main) return;

  const regex = /\{\{([a-zA-Z0-9_-]+)}}/g;

  const metaTags = document.head.querySelectorAll('meta');

  await Promise.all(Array.from(metaTags).map((meta) => sanitizeMeta(meta)));

  main.innerHTML = main.innerHTML.replaceAll(regex, (match, p1) => {
    if (!wl.includes(match.toLowerCase())) {
      return getMetadata(p1);
    }
    return match;
  });

  // handle link replacement on sheet-powered pages
  main.querySelectorAll('a[href*="#"]').forEach((a) => {
    try {
      let url = new URL(a.href);
      if (getMetadata(url.hash.replace('#', ''))) {
        a.href = getMetadata(url.hash.replace('#', ''));
        url = new URL(a.href);
      }
    } catch (e) {
      window.lana?.log(`Error while attempting to replace link ${a.href}: ${e}`);
    }
  });
}

// cleanup remaining dom blades
async function updateNonBladeContent(main) {
  const heroAnimation = main.querySelector('.hero-animation.wide');
  const templateList = main.querySelector('.template-list.fullwidth.apipowered');
  const templateX = main.querySelector('.template-x');
  const browseByCat = main.querySelector('.browse-by-category');
  const seoNav = main.querySelector('.seo-nav');
  console.log('========')
  if (heroAnimation) {
    if (getMetadata('hero-title')) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template title', getMetadata('hero-title'));
    }

    if (getMetadata('hero-text')) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template text', getMetadata('hero-text'));
    }
  }

  if (templateList) {
    await replaceDefaultPlaceholders(templateList, {
      link: getMetadata('create-link') || '/',
      tasks: getMetadata('tasks'),
    });
  }

  if (templateX) {
    console.log('-------')
    await replaceDefaultPlaceholders(templateX, {
      link: getMetadata('create-link-x') || getMetadata('create-link') || '/',
      tasks: getMetadata('tasks-x'),
    });
  }

  if (seoNav) {
    if (getMetadata('top-templates-title')) {
      seoNav.innerHTML = seoNav.innerHTML.replace('Default top templates title', getMetadata('top-templates-title'));
    }

    if (getMetadata('top-templates-text')) {
      seoNav.innerHTML = seoNav.innerHTML.replace('Default top templates text', getMetadata('top-templates-text'));
    } else {
      seoNav.innerHTML = seoNav.innerHTML.replace('Default top templates text', '');
    }
  }

  if (browseByCat && !['yes', 'true', 'on', 'Y'].includes(getMetadata('show-browse-by-category'))) {
    browseByCat.remove();
  }
}

async function validatePage() {
  const { env } = getConfig();
  const title = document.querySelector('title');

  const path = window.location.pathname.replace(`${getConfig().locale.prefix}/express/`, '');
  const pageNotFound = (env && env.name === 'prod' && getMetadata('live') === 'N') || (title && title.innerText.match(/{{(.*?)}}/));

  if (pageNotFound && !!getConfig().locale.prefix) {
    window.location.replace(`/express/${path}`);
  } else if (pageNotFound || (env && env.name === 'prod' && window.location.pathname.endsWith('/express/templates/default'))) {
    const errorPage = await fetch('/express/404');
    const html = await errorPage.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newHTMLContent = doc.documentElement.outerHTML;
    document.open();
    document.write(newHTMLContent);
    document.close();
  }
}

export function setBlockTheme(block) {
  if (getMetadata(`${block.dataset.blockName}-theme`)) {
    block.classList.add(getMetadata(`${block.dataset.blockName}-theme`));
  }
}

export default async function replaceContent(main) {
  await updateMetadataForTemplates();
  await autoUpdatePage(main);
  await updateNonBladeContent(main);
  validatePage();
}
