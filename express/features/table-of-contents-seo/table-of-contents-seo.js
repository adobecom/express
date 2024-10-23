/* eslint-disable import/named, import/extensions */
import {
  createTag,
  getIconElement,
  getMetadata,
} from '../../scripts/utils.js';
import { debounce } from '../../scripts/hofs.js';

const MOBILE_SIZE = 600;
const MOBILE_NAV_HEIGHT = 65;
const MOBILE = 'MOBILE';
const DESKTOP = 'DESKTOP';
const getDeviceType = (() => {
  let deviceType = window.innerWidth >= MOBILE_SIZE ? DESKTOP : MOBILE;
  const updateDeviceType = () => {
    deviceType = window.innerWidth >= MOBILE_SIZE ? DESKTOP : MOBILE;
  };
  window.addEventListener('resize', debounce(updateDeviceType, 100));
  return () => deviceType;
})();

function setBoldStyle(element) {
  const tocNumber = element.querySelector('.toc-number');
  const tocLink = element.querySelector('a');

  if (tocNumber) {
    tocNumber.classList.remove('toc-normal');
    tocNumber.classList.add('toc-bold');
  }

  if (tocLink) {
    tocLink.classList.remove('toc-normal');
    tocLink.classList.add('toc-bold');
  }
}

function setNormalStyle(element) {
  const tocNumber = element.querySelector('.toc-number');
  const tocLink = element.querySelector('a');

  if (tocNumber) {
    tocNumber.classList.remove('toc-bold');
    tocNumber.classList.add('toc-normal');
  }

  if (tocLink) {
    tocLink.classList.remove('toc-bold');
    tocLink.classList.add('toc-normal');
  }
}

function addHoverEffect(tocEntries) {
  tocEntries.forEach(({ tocItem }) => {
    tocItem.addEventListener('mouseenter', () => {
      if (!tocItem.classList.contains('active')) {
        setBoldStyle(tocItem);
      }
    });

    tocItem.addEventListener('mouseleave', () => {
      if (!tocItem.classList.contains('active')) {
        setNormalStyle(tocItem);
      }
    });
  });
}

function addTOCTitle(toc, { title, icon }) {
  if (!title) return;

  const tocTitle = createTag('div', { class: 'toc-title' });
  tocTitle.append(document.createTextNode(title));

  if (icon) {
    const arrowDownIcon = getIconElement('arrow-gradient-down');
    Object.assign(arrowDownIcon.style, { width: '18px', height: '18px' });
    tocTitle.prepend(arrowDownIcon);
  }

  toc.appendChild(tocTitle);
}

function formatHeadingText(headingText) {
  const cleanedText = headingText.replace('Adobe Express', '').trim();
  const latinRegex = /^[\x20-\x7F]+$/;
  const allNonLatin = !latinRegex.test(cleanedText);
  const maxLength = allNonLatin ? 12 : 25;
  const textToFormat = allNonLatin ? cleanedText : headingText;
  return textToFormat.length > maxLength
    ? `${textToFormat.substring(0, maxLength)}...`
    : textToFormat;
}

function assignHeadingIdIfNeeded(heading, headingText) {
  if (!heading.id) {
    heading.id = headingText.replace(/\s+/g, '-').toLowerCase();
  }
}

function addTOCItemClickEvent(tocItem, heading) {
  tocItem.addEventListener('click', (event) => {
    event.preventDefault();
    const headerElement = document.getElementById(heading.id);
    if (headerElement) {
      const headerRect = headerElement.getBoundingClientRect();
      const headerOffset = 70;
      const offsetPosition = headerRect.top + window.scrollY - headerOffset - MOBILE_NAV_HEIGHT;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    } else {
      console.error(`Element with id "${heading.id}" not found.`);
    }
    document.querySelector('.toc-content')?.classList.toggle('open');
  });
}

function findCorrespondingHeading(headingText, doc) {
  return Array.from(doc.querySelectorAll('main :is(h2, h3, h4)'))
    .find((h) => h.textContent.trim().includes(headingText.replace('...', '').trim()));
}

function toggleSticky(tocClone, sticky) {
  const main = document.querySelector('main .section.section-wrapper');
  if (window.scrollY >= sticky + MOBILE_NAV_HEIGHT) {
    tocClone.classList.add('sticky');
    tocClone.style.top = `${MOBILE_NAV_HEIGHT}px`;
    main.style.marginBottom = '60px';
  } else {
    tocClone.classList.remove('sticky');
    tocClone.style.top = '';
    main.style.marginBottom = '0';
  }
}

function handleTOCCloning(toc, tocEntries) {
  const mainElement = document.querySelector('.section.section-wrapper').firstElementChild;

  if (mainElement) {
    const tocClone = toc.cloneNode(true);
    tocClone.classList.add('mobile-toc');

    const titleWrapper = document.createElement('div');
    titleWrapper.classList.add('toc-title-wrapper');

    const tocTitle = tocClone.querySelector('.toc-title');

    const tocChevron = document.createElement('span');
    tocChevron.className = 'toc-chevron';

    titleWrapper.appendChild(tocTitle);
    titleWrapper.appendChild(tocChevron);

    tocClone.insertBefore(titleWrapper, tocClone.firstChild);

    const tocContent = document.createElement('div');
    tocContent.className = 'toc-content';

    tocClone.querySelectorAll('.toc-entry').forEach((entry) => {
      tocContent.appendChild(entry);
    });

    tocClone.appendChild(tocContent);
    mainElement.insertAdjacentElement('afterend', tocClone);

    titleWrapper.addEventListener('click', () => {
      tocContent.classList.toggle('open');
      tocChevron.classList.toggle('up');
    });

    const clonedTOCEntries = tocContent.querySelectorAll('.toc-entry');
    clonedTOCEntries.forEach((tocEntry, index) => {
      addTOCItemClickEvent(tocEntry, tocEntries[index].heading);
    });

    const sticky = tocClone.offsetTop - MOBILE_NAV_HEIGHT;
    window.addEventListener('scroll', () => toggleSticky(tocClone, sticky));
  }

  const originalTOC = document.querySelector('.table-of-contents-seo');
  if (originalTOC) originalTOC.style.display = 'none';
}

function setupTOCItem(tocItem, tocCounter, headingText, headingId) {
  tocItem.innerHTML = `
    <span class="toc-number">${tocCounter}</span>
    <a href="#${headingId}" daa-ll="${headingText}-${tocCounter}--">
      ${headingText}
    </a>
  `;
}

function styleHeadingLink(heading, tocCounter, toc) {
  const numberCircle = createTag('span', {
    class: 'number-circle',
    'data-number': tocCounter,
  });
  const tocClone = toc.cloneNode(true);
  tocClone.classList.add('mobile-toc');
  heading.prepend(numberCircle);
}

function addTOCEntries(toc, config, doc) {
  let tocCounter = 1;
  const tocEntries = [];
  const showContentNumbers = config['toc-content-numbers'];
  const useEllipsis = config['toc-content-ellipsis'];

  Object.keys(config).forEach((key) => {
    if (key.startsWith('content-') && !key.endsWith('-short')) {
      const tocItem = createTag('div', { class: 'toc-entry' });

      const shortKey = `${key}-short`;
      let headingText = config[shortKey] || config[key];

      if (useEllipsis) {
        headingText = formatHeadingText(headingText);
      }

      const heading = findCorrespondingHeading(config[key], doc);

      if (heading) {
        assignHeadingIdIfNeeded(heading, config[key]);
        setupTOCItem(tocItem, tocCounter, headingText, heading.id);

        const verticalLine = createTag('div', { class: 'vertical-line' });
        addTOCItemClickEvent(tocItem, heading);

        tocItem.insertBefore(createTag('span', { class: 'toc-line' }), tocItem.firstChild);
        tocItem.insertBefore(verticalLine, tocItem.firstChild);
        toc.appendChild(tocItem);
        tocEntries.push({ tocItem, heading });

        showContentNumbers && styleHeadingLink(heading, tocCounter, toc);
        setNormalStyle(tocItem);
        tocCounter += 1;
      }
    }
  });

  if (getDeviceType() !== DESKTOP) handleTOCCloning(toc, tocEntries);
  return tocEntries;
}

function setTOCPosition(toc, tocContainer) {
  const firstLink = toc.querySelector('.toc-entry a');
  if (!firstLink || !tocContainer) {
    return;
  }

  const href = firstLink.getAttribute('href');
  const partialId = href.slice(1).substring(0, 10);
  const targetElement = document.querySelector(`[id^="${partialId}"]`);

  if (!targetElement) {
    return;
  }

  const rect = targetElement.getBoundingClientRect();
  const targetTop = Math.round(window.scrollY + rect.top);
  const viewportMidpoint = window.innerHeight / 2;

  tocContainer.style.top = targetTop <= window.scrollY + viewportMidpoint
    ? `${viewportMidpoint}px`
    : `${targetTop}px`;

  tocContainer.style.position = targetTop <= window.scrollY + viewportMidpoint ? 'fixed' : 'absolute';
  tocContainer.style.display = 'block';
}

function handleSetTOCPos(toc, tocContainer) {
  window.addEventListener('scroll', () => setTOCPosition(toc, tocContainer));
}

function applyTOCBehavior(toc, tocContainer) {
  document.querySelectorAll('.mobile-toc').forEach((mobileToc) => {
    mobileToc.style.display = 'none';
  });
  handleSetTOCPos(toc, tocContainer);
}

function initializeTOCContainer() {
  const tocContainer = document.querySelector('.table-of-contents-seo');
  tocContainer.style.display = 'none';
  return tocContainer;
}

function handleActiveTOCHighlighting(tocEntries) {
  let activeEntry = null;

  window.addEventListener('scroll', () => {
    const currentHeading = tocEntries.find(({ heading }) => {
      const headerElement = document.getElementById(heading.id);
      const rect = headerElement.getBoundingClientRect();
      return rect.top <= window.innerHeight / 2 && rect.bottom > 0;
    })?.tocItem;

    if (!currentHeading) return;

    if (currentHeading !== activeEntry) {
      if (activeEntry) {
        setNormalStyle(activeEntry);
        activeEntry.classList.remove('active');
      }
      activeEntry = currentHeading;
      if (activeEntry) {
        setBoldStyle(activeEntry);
        activeEntry.classList.add('active');
      }
    }
  });
}

function buildMetadataConfigObject() {
  const title = getMetadata('toc-title');
  const showContentNumbers = getMetadata('toc-content-numbers');
  const contents = [];
  let i = 1;
  let content = getMetadata(`content-${i}`);

  while (content) {
    const abbreviatedContent = getMetadata(`content-${i}-short`);
    if (abbreviatedContent) {
      contents.push({ [`content-${i}-short`]: abbreviatedContent });
    }
    contents.push({ [`content-${i}`]: content });
    i += 1;
    content = getMetadata(`content-${i}`);
  }

  const config = contents.reduce((acc, el) => ({
    ...acc,
    ...el,
  }), { title, 'toc-content-numbers': showContentNumbers });

  return config;
}

export default async function setTOCSEO() {
  const doc = document.querySelector('main');
  const config = buildMetadataConfigObject();
  const tocSEO = createTag('div', { class: 'table-of-contents-seo' });
  const toc = createTag('div', { class: 'toc' });
  if (config.title) addTOCTitle(toc, config);

  let tocEntries;
  if (getDeviceType() === DESKTOP) {
    tocEntries = addTOCEntries(toc, config, doc);
    addHoverEffect(tocEntries);
    tocSEO.appendChild(toc);
    doc.appendChild(tocSEO);
    const tocContainer = initializeTOCContainer();
    applyTOCBehavior(toc, tocContainer);
    handleActiveTOCHighlighting(tocEntries);
  } else {
    setTimeout(() => {
      tocEntries = addTOCEntries(toc, config, doc);
    }, 50);
  }
}
