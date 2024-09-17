/* eslint-disable import/named, import/extensions */
import {
  createTag,
  getIconElement,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

export default function decorate(block, name, doc) {
  const howto = block;
  const heading = howto.closest('.section').querySelector('h2, h3, h4');
  const rows = Array.from(howto.children);

  let numberStepStart = 1;
  const isStepNumberDefined = rows[0].innerHTML.includes('number-step-start');
  if (isStepNumberDefined) {
    numberStepStart = +rows[0].querySelectorAll('div')[1].innerText.trim();
    rows[0].remove();
  }

  const narrowVariant = block?.classList.contains('narrow');
  const container = document.querySelector('div.how-to-steps.block');
  const desktop = document.body.dataset.device === 'desktop';
  if (desktop && narrowVariant && container) {
    container.classList.add('narrow');
  } else if (narrowVariant && container) {
    container.classList.remove('narrow');
    container.classList.add('narrow-mobile-width');
  }

  const includeSchema = !block.classList.contains('noschema');

  const schema = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: (heading && heading.textContent.trim()) || document.title,
    step: [],
  };

  function createHoverContainer(imgElement, row, buttonContainer) {
    let hoverContainer;

    imgElement.addEventListener('mouseenter', () => {
      if (!hoverContainer) {
        const templateHref = buttonContainer.querySelector('a').href;
        hoverContainer = document.createElement('div', { class: 'hover-container' });
        row.style.position = 'relative';

        const wrapper = createTag('div', { class: 'share-icon-wrapper' });
        const shareIcon = getIconElement('share-arrow');
        wrapper.appendChild(shareIcon);
        hoverContainer.appendChild(wrapper);

        shareIcon.addEventListener('click', () => {
          if (templateHref) {
            navigator.clipboard.writeText(templateHref).then(() => {
              console.log('template-x link copied');
            }).catch((err) => {
              console.error('Failed to copy template-x link: ', err);
            });
          }
        });

        const imageWrapper = createTag('div', { class: 'image-wrapper' });

        const enlargedImg = imgElement.cloneNode(true);
        enlargedImg.classList.add('enlarged-template-img');
        enlargedImg.style.width = `${imgElement.offsetWidth * 1.2}px`;
        enlargedImg.style.height = `${imgElement.offsetHeight * 1.2}px`;

        hoverContainer.style.pointerEvents = 'auto';
        hoverContainer.style.position = 'absolute';
        hoverContainer.style.top = `${imgElement.offsetTop - (imgElement.offsetHeight * 0.1) - 10}px`;
        hoverContainer.style.left = `${imgElement.offsetLeft - (imgElement.offsetWidth * 0.1) - 10}px`;

        buttonContainer.style.position = 'relative';
        buttonContainer.style.marginTop = '10px';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.width = '100%';

        imageWrapper.appendChild(enlargedImg);
        imageWrapper.appendChild(buttonContainer);
        hoverContainer.appendChild(imageWrapper);
        imgElement.parentElement.appendChild(hoverContainer);

        hoverContainer.addEventListener('mouseleave', () => {
          if (hoverContainer) {
            hoverContainer.remove();
            hoverContainer = null;
          }
        });
      }
    });
  }

  const templateXVariant = block?.classList.contains('template-x');
  const templateXContainer = templateXVariant && createTag('div', { class: 'template-x-container' });

  rows.forEach((row, i) => {
    if (templateXVariant && row.querySelector('picture')) {
      row.classList.add('template-x-thumbnail');
      const imgElement = row.querySelector('picture img');
      imgElement.style.borderRadius = '10px';
      const buttonContainer = row.querySelector('.button-container');
      createHoverContainer(imgElement, row, buttonContainer);
      const templateXText = row.lastElementChild;
      const text = templateXText?.textContent.trim();
      const templateXHeading = createTag('h4', { class: 'template-x-heading' }, text);
      row.insertBefore(templateXHeading, row.firstChild);
      if (templateXText) {
        templateXText.remove();
      }

      templateXContainer.appendChild(row);
    } else {
      const cells = Array.from(row.children);
      schema.step.push({
        '@type': 'HowToStep',
        position: i + 1,
        name: cells[0].textContent.trim(),
        itemListElement: {
          '@type': 'HowToDirection',
          text: cells[1].textContent.trim(),
        },
      });
      const h3 = createTag('h3');
      h3.innerHTML = cells[0].textContent.trim();
      const p = createTag('p');
      p.innerHTML = cells[1].innerHTML;
      const text = createTag('div', { class: 'tip-text' });
      text.append(h3);
      text.append(p);
      const number = createTag('div', { class: 'tip-number' }, `<span>${i + numberStepStart - 1}</span>`);
      cells[0].remove();
      cells[1].innerHTML = '';
      cells[1].classList.add('tip');
      cells[1].append(number);
      cells[1].append(text);
    }
  });

  templateXVariant && block.appendChild(templateXContainer);

  if (includeSchema) {
    const schemaTag = createTag('script', { type: 'application/ld+json' });
    schemaTag.innerHTML = JSON.stringify(schema);
    const docHead = doc.head;
    docHead.append(schemaTag);
  }
}
