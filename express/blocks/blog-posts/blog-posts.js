/* eslint-disable array-callback-return */
/* eslint-disable import/named, import/extensions */

import {
  createOptimizedPicture,
  createTag,
  readBlockConfig,
  getLanguage,
  fetchPlaceholders,
  getLocale,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

async function fetchBlogIndex(config) {
  const prefix = getLocale(window.location);
  let currentLocaleProcessed = false;
  const currentLocalePrefix = (prefix === 'us') ? '' : `/${prefix}`;
  const consolidatedJsonData = [];
  if (config.featuredOnly) {
    const linkLocales = [];
    const urls = [];
    const links = config.featured;
    for (let i = 0; i < links.length; i += 1) {
      let localePrefix = getLocale(new URL(links[i]));
      if (localePrefix === prefix) {
        currentLocaleProcessed = true;
      }
      if (localePrefix === 'us') {
        localePrefix = '';
      }
      if (!linkLocales.includes(localePrefix)) {
        linkLocales.push(localePrefix);
        const prefixedLocale = localePrefix === '' ? '' : `/${localePrefix}`;
        urls.push(`${prefixedLocale}/express/learn/blog/query-index.json`);
      }
    }
    const resp = await Promise.all(urls.map((url) => fetch(url)
      .then((res) => res.ok && res.json())))
      .then((res) => res);
    resp.forEach((item) => consolidatedJsonData.push(...item.data));
  }
  if (!currentLocaleProcessed) {
    const resp = await fetch(`${currentLocalePrefix}/express/learn/blog/query-index.json`);
    const res = await resp.json();
    consolidatedJsonData.push(...res.data);
  }

  const byPath = {};
  consolidatedJsonData.forEach((post) => {
    if (post.tags) {
      const tags = JSON.parse(post.tags);
      tags.push(post.category);
      post.tags = JSON.stringify(tags);
    }
    byPath[post.path.split('.')[0]] = post;
  });
  const index = { data: consolidatedJsonData, byPath };
  return (index);
}

function getFeatured(index, urls) {
  const paths = urls.map((url) => new URL(url).pathname.split('.')[0]);
  const results = [];
  paths.forEach((path) => {
    const post = index.byPath[path];
    if (post) {
      results.push(post);
    }
  });

  return (results);
}

function isDuplicate(path) {
  const displayed = window.blogPosts || [];
  const alreadyDisplayed = displayed.includes(path);
  displayed.push(path);
  window.blogPosts = displayed;
  return (alreadyDisplayed);
}

async function filterBlogPosts(config) {
  if (!window.blogIndex) {
    window.blogIndex = await fetchBlogIndex(config);
  }
  const result = [];
  const index = window.blogIndex;
  if (config.featured) {
    if (!Array.isArray(config.featured)) config.featured = [config.featured];
    const featured = getFeatured(index, config.featured);
    result.push(...featured);
  }

  if (!config.featuredOnly) {
    /* filter posts by tag and author */
    const f = {};
    for (const name of Object.keys(config)) {
      const filterNames = ['tags', 'author', 'category'];
      if (filterNames.includes(name)) {
        const vals = config[name];
        let v = vals;
        if (!Array.isArray(vals)) {
          v = [vals];
        }
        f[name] = v.map((e) => e.toLowerCase().trim());
      }
    }

    let numMatched = 0;

    /* filter and ignore if already in result */
    const feed = index.data.filter((post) => {
      let matchedAll = true;
      for (const name of Object.keys(f)) {
        let matched = false;
        f[name].forEach((val) => {
          if (post[name] && post[name].toLowerCase().includes(val)) {
            matched = true;
          }
        });
        if (!matched) {
          matchedAll = false;
          break;
        }
      }
      if (matchedAll && numMatched < 12) {
        matchedAll = !isDuplicate(post.path);
      }

      if (matchedAll) numMatched += 1;
      return (matchedAll);
    });
    result.push(...feed);
  }

  return (result.filter((post) => !isDuplicate(post.path)));
}

function getBlogPostsConfig($block) {
  let config = {};

  const $rows = [...$block.children];
  const $firstRow = [...$rows[0].children];

  if ($rows.length === 1 && $firstRow.length === 1) {
    /* handle links */
    const links = [...$block.querySelectorAll('a')].map(($a) => $a.href);
    config = {
      featured: links,
      featuredOnly: true,
    };
  } else {
    config = readBlockConfig($block);
  }
  return config;
}

async function filterAllBlogPostsOnPage() {
  if (!window.blogResultsLoaded) {
    let resolve;
    window.blogResultsLoaded = new Promise((r) => {
      resolve = r;
    });
    const results = [];
    window.blogPosts = [];
    const blocks = [...document.querySelectorAll('.blog-posts')];
    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];
      const config = getBlogPostsConfig(block);
      // eslint-disable-next-line no-await-in-loop
      const posts = await filterBlogPosts(config);
      results.push({ config, posts });
    }
    window.blogResults = results;
    resolve();
  } else {
    await window.blogResultsLoaded;
  }
  return (window.blogResults);
}

async function getFilteredResults(config) {
  const results = await filterAllBlogPostsOnPage();

  const configStr = JSON.stringify(config);
  let matchingResult = {};
  results.forEach((res) => {
    if (JSON.stringify(res.config) === configStr) {
      matchingResult = res.posts;
    }
  });
  return (matchingResult);
}

const loadImage = (img) => new Promise((resolve) => {
  if (img.complete && img.naturalHeight !== 0) resolve();
  else {
    img.onload = () => {
      resolve();
    };
  }
});

function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0
    && rect.left >= 0
    && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    && rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

async function decorateBlogPosts($blogPosts, config, offset = 0) {
  const posts = await getFilteredResults(config);

  const isHero = config.featured && config.featured.length === 1;

  const limit = config['page-size'] || 12;

  let $cards = $blogPosts.querySelector('.blog-cards');
  if (!$cards) {
    $blogPosts.innerHTML = '';
    $cards = createTag('div', { class: 'blog-cards' });
    $blogPosts.appendChild($cards);
  }

  const pageEnd = offset + limit;
  let count = 0;
  const images = [];
  const placeholders = await fetchPlaceholders();
  let readMoreString = placeholders['read-more'];
  if (readMoreString === undefined || readMoreString === '') {
    const locale = getLocale(window.location);
    const readMore = {
      us: 'Read More',
      uk: 'Read More',
      jp: 'もっと見る',
      fr: 'En savoir plus',
      de: 'Mehr dazu',
    };
    readMoreString = readMore[locale] || '&nbsp;&nbsp;&nbsp;&rightarrow;&nbsp;&nbsp;&nbsp;';
  }
  for (let i = offset; i < posts.length && count < limit; i += 1) {
    const post = posts[i];
    const path = post.path.split('.')[0];
    const {
      title, teaser, image,
    } = post;
    const publicationDate = new Date(post.date * 1000);
    const language = getLanguage(getLocale(window.location));
    const dateString = publicationDate.toLocaleDateString(language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });

    const imagePath = image.split('?')[0].split('_')[1];
    const cardPicture = createOptimizedPicture(`./media_${imagePath}?format=webply&optimize=medium&width=750`, title, false, [{ width: '750' }]);
    const heroPicture = createOptimizedPicture(`./media_${imagePath}?format=webply&optimize=medium&width=750`, title, false);
    let pictureTag = cardPicture.outerHTML;
    if (isHero) {
      pictureTag = heroPicture.outerHTML;
    }
    const $card = createTag('a', {
      class: `${isHero ? 'blog-hero-card' : 'blog-card'}`,
      href: path,
    });
    if (isHero) {
      $card.innerHTML = `<div class="blog-card-image">
      ${pictureTag}
      </div>
      <div class="blog-hero-card-body">
        <h3 class="blog-card-title">${title}</h3>
        <p class="blog-card-teaser">${teaser}</p>
        <p class="blog-card-date">${dateString}</p>
        <p class="blog-card-cta button-container">
          <a href="${path}" title="${readMoreString}" class="button accent">${readMoreString}</a></p>
      </div>`;
      $blogPosts.prepend($card);
    } else {
      $card.innerHTML = `<div class="blog-card-image">
        ${pictureTag}
        </div>
        <h3 class="blog-card-title">${title}</h3>
        <p class="blog-card-teaser">${teaser}</p>
        <p class="blog-card-date">${dateString}</p>`;
      $cards.append($card);
    }
    images.push($card.querySelector('img'));
    count += 1;
  }
  if (posts.length > pageEnd && config['load-more']) {
    const $loadMore = createTag('a', { class: 'load-more button secondary', href: '#' });
    $loadMore.innerHTML = config['load-more'];
    $blogPosts.append($loadMore);
    $loadMore.addEventListener('click', (event) => {
      event.preventDefault();
      $loadMore.remove();
      decorateBlogPosts($blogPosts, config, pageEnd);
    });
  }

  if (images.length) {
    const section = $blogPosts.closest('.section');
    section.style.display = 'block';
    const filteredImages = images.filter((i) => isInViewport(i));
    const imagePromises = filteredImages.map((img) => loadImage(img));
    await Promise.all(imagePromises);
    delete section.style.display;
  }
}

function checkStructure(element, querySelectors) {
  let matched = false;
  querySelectors.forEach((querySelector) => {
    if (element.querySelector(`:scope > ${querySelector}`)) matched = true;
  });
  return matched;
}

export default async function decorate($block) {
  const config = getBlogPostsConfig($block);

  // wrap p in parent section
  if (checkStructure($block.parentNode, ['h2 + p + p + div.blog-posts', 'h2 + p + div.blog-posts', 'h2 + div.blog-posts'])) {
    const wrapper = createTag('div', { class: 'blog-posts-decoration' });
    $block.parentNode.insertBefore(wrapper, $block);
    const allP = $block.parentNode.querySelectorAll(':scope > p');
    allP.forEach((p) => {
      wrapper.appendChild(p);
    });
  }

  await decorateBlogPosts($block, config);
}
