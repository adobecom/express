/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { createTag, titleCase } from '../../scripts/scripts.js';
import { getDataWithContext } from '../../scripts/browse-api-controller.js';
import buildCarousel from '../shared/carousel.js';
import isDarkOverlayReadable from '../../scripts/color-tools.js';

export default async function decorate(block) {
  block.style.visibility = 'hidden';

  const payloadContext = { urlPath: window.location.pathname };

  const ckgResult = await getDataWithContext(payloadContext);
  if (!ckgResult) return;

  const { buckets } = ckgResult?.queryResults?.[0].facets?.[0];
  const hexCodes = ckgResult?.queryResults?.[0].context?.application?.['metadata.color.hexCodes'];

  buckets.forEach((color) => {
    const colorPath = color.value;
    const colorName = color.displayValue;
    const buttonContainer = createTag('p', { class: 'button-container' });
    const aTag = createTag('a', {
      class: 'button',
      title: colorName,
      href: colorPath,
    }, titleCase(colorName));

    buttonContainer.append(aTag);
    block.append(buttonContainer);

    if (hexCodes) {
      const colorHex = hexCodes[color.canonicalName];

      if (!colorHex) return;

      const dark = isDarkOverlayReadable(colorHex);
      aTag.style.backgroundColor = colorHex;

      if (!dark) aTag.style.color = '#FFFFFF';
    }
  });

  await buildCarousel('.button-container', block);
  block.style.visibility = 'visible';
}
