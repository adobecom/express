/* eslint-disable import/named, import/extensions */

import { addTempWrapper } from '../../scripts/decorate.js';
import {
  createTag,
  readBlockConfig,
  getIconElement,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

const MOBILE_SIZE = 981;
function defineDeviceByScreenSize() {
  const screenWidth = window.innerWidth;
  if (screenWidth >= MOBILE_SIZE) return 'DESKTOP';
  return 'MOBILE';
}

function addHoverEffect(tocEntries) {
  tocEntries.forEach(({ tocItem }) => {
    tocItem.addEventListener('mouseenter', () => {
      tocItem.querySelector('.toc-number').style.fontWeight = 'bold';
      tocItem.querySelector('a').style.fontWeight = 'bold';
    });

    tocItem.addEventListener('mouseleave', () => {
      tocItem.querySelector('.toc-number').style.fontWeight = 'normal';
      tocItem.querySelector('a').style.fontWeight = 'normal';
    });
  });
}

function addTOCTitle(toc, title) {
  const tocTitle = createTag('div', { class: 'toc-title' });
  const arrow = createTag('div');
  const checkIcon = getIconElement('arrow-gradient-down');

  checkIcon.style.width = '18px';
  checkIcon.style.height = '18px';
  arrow.append(checkIcon);

  tocTitle.appendChild(arrow);
  tocTitle.appendChild(document.createTextNode(title));
  toc.appendChild(tocTitle);
}

function formatHeadingText(headingText) {
  const nonLatinRegex = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u;
  if (nonLatinRegex.test(headingText)) {
    return headingText.length > 12 ? `${headingText.substring(0, 12)}...` : headingText;
  } else {
    return headingText.length > 25 ? `${headingText.substring(0, 25)}\n${headingText.substring(25)}` : headingText;
  }
}

function findCorrespondingHeading(headingText, doc) {
  return Array.from(doc.querySelectorAll('main h2, main h3, main h4'))
    .find((h) => h.textContent.trim().includes(headingText.replace('...', '').trim()));
}

function assignHeadingIdIfNeeded(heading, headingText) {
  if (!heading.id) {
    heading.id = headingText.replace(/\s+/g, '-').toLowerCase(); // Create a URL-friendly id
  }
}

function setupTOCItem(tocItem, tocCounter, headingText, headingId) {
  tocItem.innerHTML = `<span class="toc-number">${tocCounter}.</span> 
    <a href="#${headingId}" daa-ll="${headingText}-2--" style="font-weight: normal;">
      ${headingText}
    </a>`;
}

function addTOCItemClickEvent(tocItem, heading, verticalLine) {
  tocItem.addEventListener('click', (event) => {
    event.preventDefault();

    document.querySelectorAll('.toc-entry').forEach((entry) => {
      entry.classList.remove('active');
      entry.querySelector('.vertical-line').style.display = 'none';
    });

    tocItem.classList.add('active');
    verticalLine.style.display = 'block';

    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function addTOCEntries(toc, config, doc) {
  let tocCounter = 1;
  const tocEntries = [];

  Object.keys(config).forEach((key) => {
    if (key.startsWith('item-')) {
      const tocItem = createTag('div', { class: 'toc-entry' });
      const line = createTag('span', { class: 'toc-line' });
      const verticalLine = createTag('div', { class: 'vertical-line' });

      const headingText = formatHeadingText(config[key]);
      const heading = findCorrespondingHeading(headingText, doc);

      if (heading) {
        assignHeadingIdIfNeeded(heading, headingText);
        setupTOCItem(tocItem, tocCounter, headingText, heading.id);
        addTOCItemClickEvent(tocItem, heading, verticalLine);

        tocItem.insertBefore(line, tocItem.firstChild);
        tocItem.insertBefore(verticalLine, tocItem.firstChild);
        toc.appendChild(tocItem);
        tocEntries.push({ tocItem, heading });
        tocCounter += 1;
      }
    }
  });

  return tocEntries;
}

function initializeTOCContainer() {
  const tocContainer = document.querySelector('.table-of-contents.block');
  tocContainer.style.display = 'none';
  return tocContainer;
}

function handleSetTOCPos(toc, tocContainer) {
  const headerHeight = document.querySelector('header')?.offsetHeight || 0;

  window.addEventListener('scroll', () => {
    const firstLink = toc.querySelector('.toc-entry a');
    if (firstLink && tocContainer) {
      const targetElement = document.querySelector(firstLink.getAttribute('href'));
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const targetTop = Math.round(window.scrollY + rect.top);
        const viewportMidpoint = window.innerHeight / 2;

        if (targetTop <= window.scrollY + viewportMidpoint - headerHeight) {
          tocContainer.style.top = `${viewportMidpoint}px`;
          tocContainer.style.position = 'fixed';
        } else {
          tocContainer.style.top = `${targetTop}px`;
          tocContainer.style.position = 'absolute';
        }

        tocContainer.style.display = 'block';
      }
    }
  });
}

function handleActiveTOCHighlighting(tocEntries) {
  let activeEntry = null;

  window.addEventListener('scroll', () => {
    let currentHeading = null;

    tocEntries.forEach(({ tocItem, heading }) => {
      const rect = heading.getBoundingClientRect();
      if (rect.top <= window.innerHeight / 2 && rect.bottom >= 0) {
        currentHeading = tocItem;
      }
    });

    if (currentHeading && currentHeading !== activeEntry) {
      if (activeEntry) {
        activeEntry.classList.remove('active');
        activeEntry.querySelector('.vertical-line').style.display = 'none';
      }

      activeEntry = currentHeading;
      activeEntry.classList.add('active');
      activeEntry.querySelector('.vertical-line').style.display = 'block';
    }
  });
}

export default function decorate(block, name, doc) {
  addTempWrapper(block, 'table-of-contents');

  Array.from(block.children).forEach((child) => {
    child.style.display = 'none';
  });

  const toc = createTag('div', { class: 'toc' });
  const config = readBlockConfig(block);

  if (config.title) {
    addTOCTitle(toc, config.title);
  }

  const tocEntries = addTOCEntries(toc, config, doc);
  addHoverEffect(tocEntries);
  block.innerHTML = '';
  block.appendChild(toc);

  const tocContainer = initializeTOCContainer();
  handleSetTOCPos(toc, tocContainer, tocEntries);
  handleActiveTOCHighlighting(tocEntries);
}
