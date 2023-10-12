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

import {
  createTag,
  titleCase,
} from '../../scripts/scripts.js';
import { getDataWithContext } from '../../scripts/browse-api-controller.js';
import buildCarousel from '../shared/carousel.js';
import isDarkOverlayReadable from '../../scripts/color-tools.js';

export default async function decorate(block) {
  block.style.visibility = 'hidden';
  // todo: remove the hardcoded replace
  const context = { urlPath: window.location.pathname.replace('/colors/', '/colors/color-meanings/') };

  const ckgResult = await getDataWithContext(context);
  const { buckets } = ckgResult.queryResults[0].facets[0];

  // todo: remove mocked context object
  const returnedContext = {
    application: {
      'metadata.color.hexCodes': {
        'ckg:COLOR:26511:cobalt': '#0047ab',
        'ckg:COLOR:18559:neon_blue': '#1b03a3',
        'ckg:COLOR:3496:cornflower_blue': '#6495ed',
        'ckg:COLOR:18546:glaucous': '#6082b6',
        'ckg:COLOR:26510:blue_green': '#0d98ba',
        'ckg:COLOR:3615:steel_blue': '#4682b4',
        'ckg:COLOR:3500:dark_blue': '#00008b',
        'ckg:COLOR:18534:teal_blue': '#367588',
        'ckg:COLOR:3499:cyan': '#00ffff',
        'ckg:COLOR:18536:ultramarine_blue': '#4166f5',
        'ckg:COLOR:18545:columbia_blue': '#9bddff',
        'ckg:COLOR:3610:slate_blue': '#6a5acd',
        'ckg:COLOR:18538:robin_egg_blue': '#00cccc',
        'ckg:COLOR:18554:phthalo_blue': '#000f89',
        'ckg:COLOR:18540:cerulean': '#007ba7',
        'ckg:COLOR:18547:oxford_blue': '#002147',
        'ckg:COLOR:3539:indigo': '#4b0082',
        'ckg:COLOR:26509:blue_gray': '#6699cc',
        'ckg:COLOR:18537:french_blue': '#0072bb',
        'ckg:COLOR:3567:medium_blue': '#0000cd',
        'ckg:COLOR:3479:alice_blue': '#f0f8ff',
        'ckg:COLOR:3620:turquoise': '#30d5c8',
        'ckg:COLOR:18535:blue_bell': '#a2a2d0',
        'ckg:COLOR:18548:yinmn_blue': '#2e5090',
        'ckg:COLOR:3609:sky_blue': '#87ceeb',
        'ckg:COLOR:3546:light_blue': '#add8e6',
        'ckg:COLOR:18543:cerulean_blue': '#2a52be',
        'ckg:COLOR:3483:azure': '#f0ffff',
        'ckg:COLOR:26515:ultramarine': '#120a8f',
        'ckg:COLOR:26513:electric_blue': '#7df9ff',
        'ckg:COLOR:18539:blue_sapphire': '#126180',
        'ckg:COLOR:26514:spanish_blue': '#0070b8',
        'ckg:COLOR:26508:azul': '#1d5dec',
        'ckg:COLOR:26512:cornflower': '#5170d7',
        'ckg:COLOR:3492:cadet_blue': '#5f9ea0',
        'ckg:COLOR:18541:carolina_blue': '#99badd',
        'ckg:COLOR:18542:tiffany_blue': '#0abab5',
        'ckg:COLOR:18544:blue_jeans': '#5dadec',
        'ckg:COLOR:26516:charcoal': '#36454f',
      },
    },
  };

  buckets.forEach((color) => {
    const colorPath = color.value;
    const colorName = color.displayValue;
    const colorHex = returnedContext.application['metadata.color.hexCodes'][color.canonicalName];

    const buttonContainer = createTag('p', { class: 'button-container' });
    const aTag = createTag('a', {
      class: 'button',
      title: colorName,
      href: window.location.pathname.replace(/\/[^/]*$/, `/${colorPath}`),
    }, titleCase(colorName));

    buttonContainer.append(aTag);
    block.append(buttonContainer);

    if (colorHex) {
      const dark = isDarkOverlayReadable(colorHex);
      aTag.style.backgroundColor = colorHex;

      if (!dark) aTag.style.color = '#FFFFFF';
    }
  });

  await buildCarousel('.button-container', block);
  block.style.visibility = 'visible';
}
