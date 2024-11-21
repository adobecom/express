/* eslint-disable import/named, import/extensions */

import { createOptimizedPicture, createTag, fetchPlaceholders } from '../../scripts/utils.js';

import { embedYoutube } from '../../scripts/embed-videos.js';

let rotationInterval;
let fixedImageSize = false;

function reset(block) {
  const howToWindow = block.ownerDocument.defaultView;

  howToWindow.clearInterval(rotationInterval);
  rotationInterval = null;

  const container = block.parentElement.parentElement;
  const picture = container.querySelector('picture');

  delete picture.style.height;
  container.classList.remove('no-cover');

  fixedImageSize = false;
}

const loadImage = (img) =>
  new Promise((resolve) => {
    if (img.complete && img.naturalHeight !== 0) resolve();
    else {
      img.onload = () => {
        resolve();
      };
    }
  });

function setPictureHeight(block, override) {
  if (!fixedImageSize || override) {
    // trick to fix the image height when vw > 900 and avoid image resize when toggling the tips
    const container = block.parentElement.parentElement;
    const picture = container.querySelector('picture');
    const img = picture.querySelector('img');
    const panelHeight = block.parentElement.offsetHeight;
    const imgHeight = img.naturalHeight;
    picture.style.height = `${panelHeight || imgHeight}px`;
    fixedImageSize = true;
  }
}

function activate(block, target) {
  if (block.classList.contains('image')) {
    setPictureHeight(block);
  }
  // de-activate all
  block.querySelectorAll('.tip, .tip-number').forEach((item) => {
    item.classList.remove('active');
  });

  // get index of the target
  const i = parseInt(target.getAttribute('data-tip-index'), 10);
  // activate corresponding number and tip
  block.querySelectorAll(`.tip-${i}`).forEach((elem) => elem.classList.add('active'));
}

function initRotation(howToWindow, howToDocument) {
  if (howToWindow && !rotationInterval) {
    rotationInterval = howToWindow.setInterval(() => {
      howToDocument.querySelectorAll('.tip-numbers').forEach((numbers) => {
        // find next adjacent sibling of the currently activated tip
        let activeAdjacentSibling = numbers.querySelector('.tip-number.active+.tip-number');
        if (!activeAdjacentSibling) {
          // if no next adjacent, back to first
          activeAdjacentSibling = numbers.firstElementChild;
        }
        activate(numbers.parentElement, activeAdjacentSibling);
      });
    }, 5000);
  }
}

function buildHowToStepsAccordion0(section, block, howToDocument, rows, howToWindow) {
  let indexOpenedStep = 0;

  // join wrappers together
  section.querySelectorAll('.default-content-wrapper').forEach((wrapper, i) => {
    if (i === 0) {
      // add block to first wrapper
      wrapper.append(block);
      wrapper.className = '';
    } else if (i >= 1) {
      // add children from rest of wrappers to first wrapper
      wrapper.previousElementSibling.append(...wrapper.children);
      wrapper.remove();
    }
  });

  const heading = section.querySelector('h2, h3, h4');

  const includeSchema = block.classList.contains('schema');
  if (includeSchema) {
    // this is due to block loader setting how-to-steps-accordion-schema-container
    // and not how-to-steps-accordion-container as expected
    section.classList.add('how-to-steps-accordion-container');
  }
  const schema = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: (heading && heading.textContent.trim()) || howToDocument.title,
    step: [],
  };

  const numbers = createTag('div', { class: 'tip-numbers', 'aria-role': 'tablist' });
  block.prepend(numbers);
  const tips = createTag('div', { class: 'tips' });
  block.append(tips);

  rows.forEach((row, i) => {
    row.classList.add('tip');
    row.classList.add(`tip-${i + 1}`);
    row.setAttribute('data-tip-index', i + 1);

    const cells = Array.from(row.children);

    const h3 = createTag('h3');
    h3.innerHTML = cells[0].textContent.trim();
    const text = createTag('div', { class: 'tip-text' });
    text.append(h3);
    text.append(cells[1]);

    row.innerHTML = '';
    row.append(text);

    tips.prepend(row);

    schema.step.push({
      '@type': 'HowToStep',
      position: i + 1,
      name: h3.textContent.trim(),
      itemListElement: {
        '@type': 'HowToDirection',
        text: text.textContent.trim(),
      },
    });

    const number = createTag('div', {
      class: `tip-number tip-${i + 1}`,
      tabindex: '0',
      title: `${i + 1}`,
      'aria-role': 'tab',
    });
    number.innerHTML = `<span>${i + 1}</span>`;
    number.setAttribute('data-tip-index', i + 1);

    number.addEventListener('click', (e) => {
      console.log('=== The previous indexOpenedStep', indexOpenedStep);
      indexOpenedStep = i;
      console.log('=== and now it is', indexOpenedStep);

      if (rotationInterval) {
        howToWindow.clearTimeout(rotationInterval);
      }

      let { target } = e;
      if (e.target.nodeName.toLowerCase() === 'span') {
        target = e.target.parentElement;
      }
      activate(block, target);
    });

    number.addEventListener('keyup', (e) => {
      if (e.which === 13) {
        e.preventDefault();
        e.target.click();
      }
    });

    numbers.append(number);

    if (i === 0) {
      row.classList.add('active');
      number.classList.add('active');
    }
  });

  if (includeSchema) {
    const $schema = createTag('script', { type: 'application/ld+json' });
    $schema.innerHTML = JSON.stringify(schema);
    const $head = howToDocument.head;
    $head.append($schema);
  }

  if (howToWindow) {
    howToWindow.addEventListener('resize', () => {
      reset(block);
      activate(block, block.querySelector('.tip-number.tip-1'));
      initRotation(howToWindow, howToDocument);
    });
  }

  // set initial states
  const onIntersect = ([entry], observer) => {
    if (!entry.isIntersecting) return;

    activate(block, block.querySelector('.tip-number.tip-1'));
    initRotation(howToWindow, howToDocument);

    observer.unobserve(block);
  };

  const howToStepsObserver = new IntersectionObserver(onIntersect, { rootMargin: '1000px', threshold: 0 });
  howToStepsObserver.observe(block);
}

function buildHowToStepsAccordion(section, block, howToDocument, rows, howToWindow) {
  console.log('=== SECTION, BLOCK', section, block);
  let indexOpenedStep = 0;

  for (const row of rows) {
    console.log('=== ROW', row);
  }
}

function setStepDetails(block, indexOpenedStep) {
  const listItems = block.querySelectorAll(':scope li');

  console.log('=== listItems', listItems);
  listItems.forEach((item, i) => {
    // const $detail = listItems[i].querySelector('div');
    // const $detailContainer = item.querySelector('.detail-container');
    const $detail = item.querySelector('.detail-container');

    console.log('=== detail', $detail, i, indexOpenedStep);
    if (i === indexOpenedStep) {
      $detail.classList.remove('closed');
      $detail.style.maxHeight = `${$detail.scrollHeight}px`;
      // $detail.style.marginTop = '10px';
    } else {
      $detail.classList.add('closed');
      $detail.style.maxHeight = '0';
      // $detail.style.marginTop = '0';
    }
  });
}

function buildAccordion(block, rows, $stepsContent) {
  console.log('=== BLOCK', block);
  let indexOpenedStep = 0;

  // const container = document.querySelector(".how-to-steps-accordion-video-container");
  // console.log("=== container", container)
  // if (container) container.classList.add("how-to-steps-accordion-container")

  for (const row of rows) {
    console.log('=== ROW', row);
  }

  const $list = createTag('OL', { class: 'steps' });
  // const numbers = createTag('div', { class: 'tip-numbers', 'aria-role': 'tablist' });

  // for (const row of block.children)

  rows.forEach((row, i) => {
    console.log('=== ROW', row);

    const [stepTitle, stepDetail] = row.querySelectorAll(':scope div');

    console.log('=== stepTitle', stepTitle, stepTitle.children);

    const $newStepTitle = createTag('h3');
    $newStepTitle.replaceChildren(...stepTitle.childNodes);

    // if (i !== 0) {
    //   stepDetail.classList.add('closed');
    // }

    const $listItem = createTag('LI', { class: 'step', tabindex: '0' });
    $list.append($listItem);

    const $listItemIndicator = createTag('div', { class: 'step-indicator' });
    const $listItemContent = createTag('div', { class: 'step-content' });

    // $listItem.append(row)

    const $detailText = stepDetail;
    // createTag('div', { class: 'detail-container' });

    $detailText.classList.add('detail-text');

    const $detailContainer = createTag('div', { class: 'detail-container' });

    if (i !== 0) {
      $detailContainer.classList.add('closed');
    }

    $detailContainer.append($detailText);

    // $detailContainer.append(stepDetail)

    $listItem.append($listItemIndicator);
    $listItem.append($listItemContent);

    $listItemContent.append($newStepTitle);
    $listItemContent.append($detailContainer);

  //   const handleOpenDetails = (ev) => {
  //     indexOpenedStep = i;
  //     setStepDetails(block, indexOpenedStep);
  //     ev.preventDefault();
  //   }

  //   $newStepTitle.addEventListener('click', (ev) => {
  //     // ev.stopPropagation();
  //     // ev.preventDefault();
  //     indexOpenedStep = i;
  //     setStepDetails(block, indexOpenedStep);
  //   }
  // );

  //   $listItem.addEventListener('keypress', (ev) => {
  //     // ev.stopPropagation();
  //     // ev.preventDefault();
  //     indexOpenedStep = i;
  //     setStepDetails(block, indexOpenedStep);
  //     ev.preventDefault();
  //   });

  const handleOpenDetails = (ev) => {
    indexOpenedStep = i;
    setStepDetails(block, indexOpenedStep);
    ev.preventDefault();
  };

  $newStepTitle.addEventListener('click', handleOpenDetails);
  $listItem.addEventListener('keyup', (ev) => (ev.which === 13 && handleOpenDetails(ev)));


  });

  // return $list;

  // const accordion = buildAccordion(block);

  $stepsContent.append($list);
  // block.replaceChildren($list);

  // set this in next event cycle when scrollHeight has been established
  setTimeout(() => {
    setStepDetails(block, indexOpenedStep);
  }, 0);

  // return block;
}

export default async function decorate(block) {
  // return;
  console.log('=== IN decorate', block);

  // block.classList.add('trytry')

  const howToWindow = block.ownerDocument.defaultView;
  const howToDocument = block.ownerDocument;
  const isVideoVariant = block.classList.contains('video');
  const isImageVariant = block.classList.contains('image');

  // move first image of container outside of div for styling
  const section = block.closest('.section');
  // const howto = block;
  const rows = Array.from(block.children);

  const backgroundRow = block.children[0];
  const backgroundImage = backgroundRow.querySelector('img');
  const backgroundURL = backgroundImage?.src;
  const hasBackground = !!backgroundURL;
  if (hasBackground) {
    rows.shift();
  }

  console.log('=== backgroundRow', backgroundRow, backgroundURL, hasBackground);

  let picture;

  if (isVideoVariant || isImageVariant) {


    const $stepsContent = createTag('div', { class: 'steps-content' });

    if (hasBackground) {
      // So that background image goes beyond container
      const $stepsContentBackground = createTag('div', { class: 'steps-content-backg' });
      const $stepsContentBackgroundImg = createTag('img', { class: 'steps-content-backg-image' });

      // videoEl.style.background = `url(${backgroundURL})`
      //  videoContainerEl.style.background = `url(${backgroundURL})`;
      // $stepsContent.style.background = `url(${backgroundURL})`;
      // $stepsContent.style.backgroundSize = `75%`;
      // $stepsContent.style.backgroundRepeat = `no-repeat`;
      // $stepsContent.style.backgroundPosition = `-10% -10%`;
      $stepsContent.append($stepsContentBackground);
      $stepsContentBackground.append($stepsContentBackgroundImg);
      $stepsContentBackgroundImg.src = backgroundURL;
      // $stepsContentBackground.style.background = `url(${backgroundURL}) -12px -38px / 100% no-repeat`;
      $stepsContentBackground.style.position = 'absolute';
      $stepsContentBackground.style.top = '-36px';
      $stepsContentBackground.style.left = '-24px';
      $stepsContentBackground.style.zIndex = -1;
    }




    if (isVideoVariant) {
      const videoData = rows.shift();

      // remove the added social link from the block DOM
      block.removeChild(block.children[0]);

      const videoLink = videoData.querySelector('a');
      const youtubeURL = videoLink?.href;
      const url = new URL(youtubeURL);

      const videoContainerEl = createTag('div', { class: 'video-container' });

      const videoEl = embedYoutube(url);
      videoEl.classList.add('video-how-to-steps-accordion');

      videoContainerEl.append(videoEl);
      $stepsContent.append(videoContainerEl);
    } else {
      const imageData = rows.shift();

      // // remove the added social link from the block DOM
      // block.removeChild(block.children[0]);

      const imageEl = imageData.querySelector('picture');
      console.log("=== imageEl", imageEl);

      const imageContainerEl = createTag('div', { class: 'image-container' });
      imageContainerEl.append(imageEl);
      $stepsContent.append(imageContainerEl);
      // const youtubeURL = videoLink?.href;
      // const url = new URL(youtubeURL);

      // const videoContainerEl = createTag('div', { class: 'video-container' });

      // const videoEl = embedYoutube(url);
      // videoEl.classList.add('video-how-to-steps-accordion');

      // videoContainerEl.append(videoEl);
    }

    // section.prepend(videoEl);


    const heading = section.querySelector('h2, h3, h4');
    console.log('=== heading', heading);

    block.replaceChildren(heading, $stepsContent);
    // block.prepend(heading);
    // block.append($stepsContent)
    buildAccordion(block, rows, $stepsContent);
  }

  // buildHowToStepsAccordion(section, block, howToDocument, rows, howToWindow);
  // buildHowToStepsAccordion(section, block, howToDocument, rows, howToWindow);

  // const accordion = buildAccordion(block);
  // block.replaceChildren(accordion)
  // return block;
}
