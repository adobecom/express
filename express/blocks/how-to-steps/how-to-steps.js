/* eslint-disable import/named, import/extensions */

import {
  createTag,
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
      if (!hoverContainer) { // Ensure the container is not already created
        console.log('Mouse entered image:', imgElement);

        // Create a new div element for the hover container
        hoverContainer = document.createElement('div', { class: 'hover-container' });

        // Ensure the parent row is relatively positioned
        row.style.position = 'relative';

        const imageWrapper = createTag('div', { class: 'image-wrapper' });

        // Clone the original image to create an enlarged version
        const enlargedImg = imgElement.cloneNode(true);
        enlargedImg.classList.add('enlarged-template-img');
        enlargedImg.style.width = `${imgElement.offsetWidth * 1.2}px`;
        enlargedImg.style.height = `${imgElement.offsetHeight * 1.2}px`;

        // Prevent the hover container from blocking mouse events
        hoverContainer.style.pointerEvents = 'auto'; // Allow mouse events on the hover container
        hoverContainer.style.position = 'absolute';
        hoverContainer.style.top = `${imgElement.offsetTop - (imgElement.offsetHeight * 0.1) - 10}px`; // Adjust for padding
        hoverContainer.style.left = `${imgElement.offsetLeft - (imgElement.offsetWidth * 0.1) - 10}px`;

        // Ensure the button container is positioned below the enlarged image within the wrapper
        buttonContainer.style.position = 'relative';
        buttonContainer.style.marginTop = '10px'; // Add some space between the image and the button
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center'; // Center the button horizontally
        buttonContainer.style.width = '100%';

        // Append the enlarged image to the image wrapper
        imageWrapper.appendChild(enlargedImg);

        // Append the button container to the image wrapper
        imageWrapper.appendChild(buttonContainer);

        // Append the image wrapper to the hover container
        hoverContainer.appendChild(imageWrapper);

        // Append the hover container to the row, over the image
        imgElement.parentElement.appendChild(hoverContainer);

        // Add the mouseleave event listener to the hoverContainer
        hoverContainer.addEventListener('mouseleave', () => {
          if (hoverContainer) { // Ensure the container exists before trying to remove it
            console.log('Mouse left hover container:', hoverContainer);

            // Remove the hover container when the mouse leaves
            hoverContainer.remove();
            hoverContainer = null; // Reset the hover container reference
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
      const buttonContainer = row.querySelector('.button-container'); // Assume each row has a button-container

      // Call the function to handle hover effect
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
