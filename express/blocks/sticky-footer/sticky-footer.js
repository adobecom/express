import {
  createTag, fetchPlaceholders, getIcon, readBlockConfig,
} from '../../utils/utils.js';
import { addTempWrapper } from '../../utils/decorate.js';

/**
 * @param {number} [rating=5]
 */
function createStars(rating = 5) {
  if (typeof rating === 'string') {
    // eslint-disable-next-line no-param-reassign
    rating = Number.parseFloat(rating);
  }
  const rHalves = Math.round(rating / 0.5);
  const whole = Math.floor(rHalves / 2);
  let hasHalf = rHalves % 2;

  let str = '';
  for (let i = 0; i < 5; i += 1) {
    let type = 'star';
    if (i < whole) {
      type = 'star';
    } else if (hasHalf) {
      type = 'star-half';
      hasHalf = 0;
    } else {
      type = 'star-empty';
    }

    str += getIcon(type);
  }

  return str;
}

function createRatings() {
  return `
<span class="rating-stars">
  ${createStars()}
  <span class="rating-votes">5 • -</span>
</span>`;
}

/**
 * @param {HTMLImageElement} ratingsImg
 */
async function insertRatings(ratingsImg) {
  const d = createTag('div');
  d.innerHTML = createRatings();
  ratingsImg.parentElement.replaceWith(d);

  fetchPlaceholders().then((p) => {
    // update ratings
    const rating = p['apple-store-rating-score'];
    const count = p['apple-store-rating-count'];
    const container = d.querySelector(':scope span.rating-stars');
    container.innerHTML = `${createStars(rating)}
    <span class="rating-votes">${rating} • ${count} Ratings</span>`;
  });
}

function attachScrollHandler() {
  const docEl = document.documentElement;
  const pad = 20;
  const el = document.querySelector('main .sticky-footer-wrapper');
  let hidden = false;
  document.addEventListener('scroll', () => {
    if (!hidden && docEl.scrollTop >= docEl.offsetHeight - window.innerHeight - pad) {
      hidden = true;
      el.style.top = `calc(100% + ${el.clientHeight}px)`;
    } else if (hidden && docEl.scrollTop < docEl.offsetHeight - window.innerHeight - pad) {
      hidden = false;
      el.style.top = '100%';
    }
  });
}

/**
 * @param {HTMLDivElement} $block
 */
export default function decorate($block) {
  addTempWrapper($block, 'sticky-footer');

  if (document.body.dataset.device === 'mobile') {
    $block.remove();
  }

  const conf = readBlockConfig($block);

  $block.querySelectorAll(':scope > div').forEach(($row, i) => {
    if (i >= 1) {
      $row.remove();
    }
  });

  if (conf['apple-store']) {
    const $icon = $block.querySelector('img.icon.icon-apple-store');
    if ($icon) {
      const $link = createTag('a', { href: conf['apple-store'] });
      $icon.parentElement.replaceChild($link, $icon);
      $link.append($icon);
    }
  }

  if (conf['google-store']) {
    const $icon = $block.querySelector('img.icon.icon-google-store');
    if ($icon) {
      const $link = createTag('a', { href: conf['google-store'] });
      $icon.parentElement.replaceChild($link, $icon);
      $link.append($icon);
    }
  }

  const $copyIcon = $block.querySelector('img.icon-copy');
  if ($copyIcon) {
    const sib = $copyIcon.previousElementSibling;
    if (!sib) return;

    const link = sib.querySelector('a[href]');
    if (!link || !link.href) return;

    const { href } = link;
    $copyIcon.onclick = () => {
      navigator.clipboard.writeText(href);
    };
  }

  const ratingsImg = $block.querySelector(':scope img[alt="ratings:ios"]');
  if (ratingsImg) {
    insertRatings(ratingsImg);
  }

  attachScrollHandler();
}
