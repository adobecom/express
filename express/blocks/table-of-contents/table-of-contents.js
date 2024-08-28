/* eslint-disable import/named, import/extensions */

import { addTempWrapper } from '../../scripts/decorate.js';
import {
  createTag,
  readBlockConfig,
  getIconElement,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

const MOBILE_SIZE = 981;
function getCurrentDeviceType() {
  let deviceType = window.innerWidth >= MOBILE_SIZE ? 'DESKTOP' : 'MOBILE';

  const updateDeviceType = () => {
    deviceType = window.innerWidth >= MOBILE_SIZE ? 'DESKTOP' : 'MOBILE';
  };

  // Add resize event listener to update device type when window is resized
  window.addEventListener('resize', updateDeviceType);

  // Return a function that provides the current device type
  return () => deviceType;
}

// Initialize the device type function
const getDeviceType = getCurrentDeviceType();

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

    if (getDeviceType() === 'MOBILE') {
      const mobileOffset = 185; // Adjust this value to control the scroll offset on mobile
      const headingPosition = heading.getBoundingClientRect().top + window.scrollY - mobileOffset;
      window.scrollTo({
        top: headingPosition,
        behavior: 'smooth',
      });
    } else {
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

function styleHeadingLink(heading, tocCounter) {
  const numberCircle = createTag('span', {
    class: 'number-circle',
    'data-number': tocCounter, // Set the data-number attribute
  });

  // Do not set any inner text for numberCircle here
  heading.prepend(numberCircle);
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

        styleHeadingLink(heading, tocCounter); // Style the heading link with the number circle

        tocCounter += 1;
      }
    }
  });

  // Check if the device is mobile
  if (getDeviceType() === 'MOBILE') {
    tocEntries.forEach(({ heading }) => {
      // Clone the TOC element
      const tocClone = toc.cloneNode(true);

      // Add a class to the cloned TOC
      tocClone.classList.add('mobile-toc'); // Add a custom class to the cloned TOC

      // Insert the cloned TOC before each corresponding heading
      heading.parentNode.insertBefore(tocClone, heading);
    });

    // Find the element that has .table-of-contents.block and hide it
    const originalTOC = document.querySelector('.table-of-contents.block');
    if (originalTOC) {
      originalTOC.style.display = 'none';
    }
  }

  return tocEntries;
}

function handleScrollForTOC(tocContainer) {
  // This function handles the scroll behavior for the TOC on desktop devices
  const headerHeight = document.querySelector('header')?.offsetHeight || 0;
  const firstLink = tocContainer.querySelector('.toc-entry a');
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

function applyTOCBehavior(toc, tocContainer) {
  if (getDeviceType() === 'MOBILE') {
    // Hide the desktop TOC on mobile
    tocContainer.style.display = 'none';
    // Ensure it's always hidden when scrolling on mobile
    window.addEventListener('scroll', () => {
      if (getDeviceType() === 'MOBILE') {
        tocContainer.style.display = 'none';
      }
    });
  } else {
    // On desktop, use sticky behavior and hide mobile TOC elements
    const mobileTocs = document.querySelectorAll('.mobile-toc');
    mobileTocs.forEach((mobileToc) => {
      mobileToc.style.display = 'none';
    });

    handleSetTOCPos(toc, tocContainer);
    window.addEventListener('scroll', () => handleScrollForTOC(tocContainer));
  }
}

function initializeTOCContainer() {
  const tocContainer = document.querySelector('.table-of-contents.block');
  // Hide the desktop TOC on mobile
  if (getDeviceType() === 'MOBILE') {
    tocContainer.style.display = 'none';
  }
  return tocContainer;
}

function handleActiveTOCHighlighting(tocEntries) {
  let activeEntry = null;

  window.addEventListener('scroll', () => {
    let currentHeading = null;

    tocEntries.forEach(({ tocItem, heading }) => {
      const rect = heading.getBoundingClientRect();
      const isVisible = rect.top <= window.innerHeight / 2 && rect.bottom > 0;

      if (isVisible) {
        currentHeading = tocItem;
      }
    });

    if (currentHeading && currentHeading !== activeEntry) {
      if (activeEntry) {
        // Remove bold style from the previously active entry
        activeEntry.classList.remove('active');
        activeEntry.querySelector('a').style.fontWeight = 'normal';
        activeEntry.querySelector('.toc-number').style.fontWeight = 'normal';
      }

      // Apply bold style to the currently active entry
      activeEntry = currentHeading;
      activeEntry.classList.add('active');
      activeEntry.querySelector('a').style.fontWeight = 'bold';
      activeEntry.querySelector('.toc-number').style.fontWeight = 'bold';
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

  applyTOCBehavior(toc, tocContainer);
  handleActiveTOCHighlighting(tocEntries);
}
