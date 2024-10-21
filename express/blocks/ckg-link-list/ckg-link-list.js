import { createTag, titleCase } from '../../scripts/utils.js';
import getData from '../../scripts/browse-api-controller.js';
import buildCarousel from '../shared/carousel.js';

function addColorSampler(colorHex, btn) {
  const colorDot = createTag('div', {
    class: 'color-dot',
    style: `background-color: ${colorHex}`,
  });

  const aTag = btn.querySelector('a');
  btn.style.backgroundColor = colorHex;
  aTag.classList.add('colorful');

  aTag.prepend(colorDot);
}

export default async function decorate(block) {
  block.style.visibility = 'hidden';

  const pills = await getData();
  if (!pills?.length) return;

  pills.forEach(({ canonicalName: colorName, metadata: { link, hexCode: colorHex } }) => {
    if (!colorName || !link || !colorHex) return;
    const buttonContainer = createTag(
      'p',
      { class: 'button-container' },
      createTag(
        'a',
        {
          class: 'button',
          title: colorName,
          href: link,
        },
        titleCase(colorName),
      ),
    );
    block.append(buttonContainer);

    colorHex && addColorSampler(colorHex, buttonContainer);
  });

  if (!block.children) return;

  const options = {
    centerAlign: true,
  };
  await buildCarousel('.button-container', block, options);
  block.style.visibility = 'visible';
}
