/* eslint-disable import/named, import/extensions */

import { addTempWrapper } from '../../scripts/decorate.js';
import {
  createTag,
  readBlockConfig,
  getIconElement,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

export default function decorate(block, name, doc) {
  addTempWrapper(block, 'table-of-contents');
  // Hide the initial div elements within the block
  Array.from(block.children).forEach((child) => {
    child.style.display = 'none';
  });

  // Create a new TOC container
  const toc = createTag('div', { class: 'toc' });

  // Read the config
  const config = readBlockConfig(block);

  // Add the title to the top of the TOC if available in config
  if (config.title) {
    const tocTitle = createTag('div', { class: 'toc-title' });

    // Create the arrow element
    const arrow = createTag('div');
    const checkIcon = getIconElement('arrow-gradient-down');
    checkIcon.style.width = '18px';
    checkIcon.style.height = '18px';
    arrow.append(checkIcon);

    // Add the arrow and the title text to the tocTitle
    tocTitle.appendChild(arrow);
    tocTitle.appendChild(document.createTextNode(config.title));

    toc.appendChild(tocTitle);
  }

  // Counter for TOC numbering
  let tocCounter = 1;

  // Iterate over each item in the config that starts with 'item-'
  const tocEntries = [];
  Object.keys(config).forEach((key) => {
    if (key.startsWith('item-')) {
      const tocItem = createTag('div', { class: 'toc-entry' });

      // Create the vertical line span
      const line = createTag('span', { class: 'toc-line' });

      // Create the verticalLine div
      const verticalLine = createTag('div', { class: 'vertical-line' });

      // Search for a corresponding heading in the document
      let headingText = config[key];

      // Check if the heading text contains non-Latin characters and is over 12 characters
      const nonLatinRegex = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u;
      if (nonLatinRegex.test(headingText) && headingText.length > 12) {
        headingText = `${headingText.substring(0, 12)}...`;
      }

      const heading = Array.from(doc.querySelectorAll('main h2, main h3, main h4'))
        .find((h) => h.textContent.trim().includes(headingText.replace('...', '').trim()));

      if (heading) {
        // Assign an id to the heading if it doesn't have one
        if (!heading.id) {
          heading.id = headingText.replace(/\s+/g, '-').toLowerCase(); // Create a URL-friendly id
        }

        // Set up the TOC entry with the format specified
        tocItem.innerHTML = `<span class="toc-number">${tocCounter}.</span> <a href="#${heading.id}" daa-ll="${headingText}-2--" style="font-weight: normal;">${headingText}</a>`;
        tocItem.insertBefore(line, tocItem.firstChild); // Insert the line before the text
        tocItem.insertBefore(verticalLine, tocItem.firstChild); // Insert the vertical line

        // Add click event to show the verticalLine and scroll to the heading
        tocItem.addEventListener('click', (event) => {
          event.preventDefault();

          // Remove the active class from all TOC entries
          document.querySelectorAll('.toc-entry').forEach((entry) => {
            entry.classList.remove('active');
            entry.querySelector('.vertical-line').style.display = 'none'; // Hide the line
          });

          // Add the active class to the clicked entry
          tocItem.classList.add('active');
          verticalLine.style.display = 'block'; // Show the line

          // Scroll to the heading
          heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        toc.appendChild(tocItem);
        tocEntries.push({ tocItem, heading }); // Store the TOC entry and corresponding heading

        // Increment the TOC counter
        tocCounter += 1;
      }
    }
  });

  // Clear the block and append the new TOC
  block.innerHTML = '';
  block.appendChild(toc);

  // Track the currently active TOC entry to prevent double highlighting
  let activeEntry = null;

  // Select the TOC container
  const tocContainer = document.querySelector('.table-of-contents.block');
  // Initially hide the TOC container (optional, if needed)
  tocContainer.style.display = 'none';

  const headerHeight = document.querySelector('header')?.offsetHeight || 0; // Defaults to 0 if no header is found

  // Scroll event listener
  window.addEventListener('scroll', () => {
    const firstLink = toc.querySelector('.toc-entry a');
    if (firstLink && tocContainer) {
      // Step 1: Use the href attribute directly to find the target element
      const targetElement = document.querySelector(firstLink.getAttribute('href'));
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();

        const targetTop = Math.round(window.scrollY + rect.top);
        const viewportMidpoint = window.innerHeight / 2;

        // Determine if the TOC container should be fixed at 50% of the viewport height
        if (targetTop <= window.scrollY + viewportMidpoint - headerHeight) {
          tocContainer.style.top = `${viewportMidpoint}px`; // Fix at 50% of the viewport
          tocContainer.style.position = 'fixed'; // Change to fixed positioning
        } else {
          tocContainer.style.top = `${targetTop}px`; // Align with the heading
          tocContainer.style.position = 'absolute'; // Maintain absolute positioning
        }

        // Optionally show the TOC container if it was initially hidden
        tocContainer.style.display = 'block';
      }
    }
  });

  // Add scroll event listener to highlight the current section
  window.addEventListener('scroll', () => {
    let currentHeading = null;

    tocEntries.forEach(({ tocItem, heading }) => {
      const rect = heading.getBoundingClientRect();
      if (rect.top <= window.innerHeight / 2 && rect.bottom >= 0) {
        currentHeading = tocItem;
      }
    });

    if (currentHeading && currentHeading !== activeEntry) {
      // Remove the active class from the previous active entry
      if (activeEntry) {
        activeEntry.classList.remove('active');
        activeEntry.querySelector('.vertical-line').style.display = 'none';
      }

      // Set the new active entry
      activeEntry = currentHeading;
      activeEntry.classList.add('active');
      activeEntry.querySelector('.vertical-line').style.display = 'block';
    }
  });
}
