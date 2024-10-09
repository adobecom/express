import { createTag, getConfig, titleCase } from '../../scripts/utils.js';
import { getDataWithContext } from '../../scripts/browse-api-controller.js';
import buildCarousel from '../shared/carousel.js';

function addColorSampler(pill, colorHex, btn) {
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

  const payloadContext = { urlPath: block.textContent.trim() || window.location.pathname };
  const ckgResult = await getDataWithContext(payloadContext);
  if (!ckgResult) return;
  const results = ckgResult?.querySuggestionResults?.groupResults;
  const pills = results?.[0]?.buckets;
  const hexCodes = ckgResult?.queryResults?.[0].context?.application?.['metadata.color.hexCodes'];

  if (!pills || !pills.length) return;

  pills.forEach((pill) => {
    const colorHex = hexCodes[pill.canonicalName];
    const { prefix } = getConfig().locale;
    if (pill.value.startsWith(`${prefix}/express/colors/search`)) {
      return;
    }

    const colorPath = pill.value;
    const colorName = pill.displayValue;
    const buttonContainer = createTag('p', { class: 'button-container' });
    const aTag = createTag('a', {
      class: 'button',
      title: colorName,
      href: colorPath,
    }, titleCase(colorName));

    buttonContainer.append(aTag);
    block.append(buttonContainer);

    if (colorHex) {
      addColorSampler(pill, colorHex, buttonContainer);
    }
  });

  if (!block.children) return;

  const options = {
    centerAlign: true,
  };
  await buildCarousel('.button-container', block, options);
  block.style.visibility = 'visible';
}
