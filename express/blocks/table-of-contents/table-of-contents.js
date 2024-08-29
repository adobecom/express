/* eslint-disable import/named, import/extensions */

import { addTempWrapper } from '../../scripts/decorate.js';
import { createTag, readBlockConfig, getIconElement } from '../../scripts/utils.js';

const MOBILE_SIZE = 981;
const getDeviceType = (() => {
  let deviceType = window.innerWidth >= MOBILE_SIZE ? 'DESKTOP' : 'MOBILE';
  window.addEventListener('resize', () => {
    deviceType = window.innerWidth >= MOBILE_SIZE ? 'DESKTOP' : 'MOBILE';
  });
  return () => deviceType;
})();

function setBoldStyle(element, isBold) {
  const fontWeight = isBold ? 'bold' : 'normal';
  element.querySelector('.toc-number').style.fontWeight = fontWeight;
  element.querySelector('a').style.fontWeight = fontWeight;
}

function addHoverEffect(tocEntries) {
  tocEntries.forEach(({ tocItem }) => {
    tocItem.addEventListener('mouseenter', () => setBoldStyle(tocItem, true));
    tocItem.addEventListener('mouseleave', () => setBoldStyle(tocItem, false));
  });
}

function addTOCTitle(toc, title) {
  const tocTitle = createTag('div', { class: 'toc-title' });
  const checkIcon = getIconElement('arrow-gradient-down');
  checkIcon.style.width = '18px';
  checkIcon.style.height = '18px';

  tocTitle.appendChild(checkIcon);
  tocTitle.appendChild(document.createTextNode(title));
  toc.appendChild(tocTitle);
}

function formatHeadingText(headingText) {
  const nonLatinRegex = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u;
  const maxLength = nonLatinRegex.test(headingText) ? 12 : 25;
  return headingText.length > maxLength ? `${headingText.substring(0, maxLength)}...` : headingText;
}

function assignHeadingIdIfNeeded(heading, headingText) {
  if (!heading.id) {
    heading.id = headingText.replace(/\s+/g, '-').toLowerCase();
  }
}

function addTOCItemClickEvent(tocItem, heading) {
  tocItem.addEventListener('click', (event) => {
    event.preventDefault();

    const headerOffset = 70;
    const rect = heading.getBoundingClientRect();
    const offsetPosition = rect.top + window.scrollY - headerOffset;

    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
  });
}

function findCorrespondingHeading(headingText, doc) {
  return Array.from(doc.querySelectorAll('main h2, main h3, main h4'))
    .find((h) => h.textContent.trim().includes(headingText.replace('...', '').trim()));
}

function handleTOCCloningForMobile(toc, tocEntries) {
  if (getDeviceType() !== 'MOBILE') return;

  const tocClone = toc.cloneNode(true);
  tocClone.classList.add('mobile-toc');

  tocEntries.forEach(({ heading }) => {
    const clonedTOC = tocClone.cloneNode(true);
    heading.parentNode.insertBefore(clonedTOC, heading);

    const clonedTOCEntries = clonedTOC.querySelectorAll('.toc-entry');
    clonedTOCEntries.forEach((tocEntry, index) => {
      addTOCItemClickEvent(tocEntry, tocEntries[index].heading);
    });
  });

  const originalTOC = document.querySelector('.table-of-contents.block');
  if (originalTOC) originalTOC.style.display = 'none';
}

function setupTOCItem(tocItem, tocCounter, headingText, headingId) {
  tocItem.innerHTML = `
    <span class="toc-number">${tocCounter}.</span>
    <a href="#${headingId}" daa-ll="${headingText}-2--" style="font-weight: normal;">
      ${headingText}
    </a>
  `;
}

function styleHeadingLink(heading, tocCounter) {
  const numberCircle = createTag('span', {
    class: 'number-circle',
    'data-number': tocCounter,
  });
  heading.prepend(numberCircle);
}

function addTOCEntries(toc, config, doc) {
  let tocCounter = 1;
  const tocEntries = [];

  Object.keys(config).forEach((key) => {
    if (key.startsWith('item-')) {
      const tocItem = createTag('div', { class: 'toc-entry' });
      const headingText = formatHeadingText(config[key]);
      const heading = findCorrespondingHeading(headingText, doc);

      if (heading) {
        assignHeadingIdIfNeeded(heading, headingText);
        setupTOCItem(tocItem, tocCounter, headingText, heading.id);

        const verticalLine = createTag('div', { class: 'vertical-line' });
        addTOCItemClickEvent(tocItem, heading);

        tocItem.insertBefore(createTag('span', { class: 'toc-line' }), tocItem.firstChild);
        tocItem.insertBefore(verticalLine, tocItem.firstChild);
        toc.appendChild(tocItem);
        tocEntries.push({ tocItem, heading });

        styleHeadingLink(heading, tocCounter);
        tocCounter += 1;
      }
    }
  });

  handleTOCCloningForMobile(toc, tocEntries);
  return tocEntries;
}

function setTOCPosition(toc, tocContainer, headerHeight) {
  const firstLink = toc.querySelector('.toc-entry a');
  if (firstLink && tocContainer) {
    const targetElement = document.querySelector(firstLink.getAttribute('href'));
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const targetTop = Math.round(window.scrollY + rect.top);
      const viewportMidpoint = window.innerHeight / 2;

      tocContainer.style.top = targetTop <= window.scrollY + viewportMidpoint - headerHeight
        ? `${viewportMidpoint}px`
        : `${targetTop}px`;

      tocContainer.style.position = targetTop <= window.scrollY + viewportMidpoint - headerHeight ? 'fixed' : 'absolute';
      tocContainer.style.display = 'block';
    }
  }
}

function handleSetTOCPos(toc, tocContainer) {
  const headerHeight = document.querySelector('header')?.offsetHeight || 0;
  window.addEventListener('scroll', () => setTOCPosition(toc, tocContainer, headerHeight));
}

function applyTOCBehavior(toc, tocContainer) {
  if (getDeviceType() === 'MOBILE') {
    tocContainer.style.display = 'none';
  } else {
    document.querySelectorAll('.mobile-toc').forEach((mobileToc) => {
      mobileToc.style.display = 'none';
    });
    handleSetTOCPos(toc, tocContainer);
  }
}

function initializeTOCContainer() {
  const tocContainer = document.querySelector('.table-of-contents.block');
  tocContainer.style.display = 'none';
  return tocContainer;
}

function handleActiveTOCHighlighting(tocEntries) {
  let activeEntry = null;

  window.addEventListener('scroll', () => {
    const currentHeading = tocEntries.find(({ heading }) => {
      const rect = heading.getBoundingClientRect();
      return rect.top <= window.innerHeight / 2 && rect.bottom > 0;
    })?.tocItem;
    if (!currentHeading) return;

    if (currentHeading !== activeEntry) {
      if (activeEntry) {
        setBoldStyle(activeEntry, false);
        activeEntry.classList.remove('active');
      }
      activeEntry = currentHeading;
      if (activeEntry) {
        setBoldStyle(activeEntry, true);
        activeEntry.classList.add('active');
      }
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

  if (config.title) addTOCTitle(toc, config.title);

  const tocEntries = addTOCEntries(toc, config, doc);
  addHoverEffect(tocEntries);
  block.innerHTML = '';
  block.appendChild(toc);

  const tocContainer = initializeTOCContainer();
  applyTOCBehavior(toc, tocContainer);
  handleActiveTOCHighlighting(tocEntries);
}
