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

import { createTag, getMetadata, titleCase } from '../../scripts/scripts.js';
import { getDataWithContext } from '../../scripts/api-v3-controller.js';
import buildCarousel from '../shared/carousel.js';

export default async function decorate(block) {
  block.style.visibility = 'hidden';
  const context = {
    urlPath: window.location.pathname,
    task: getMetadata('tasks'),
    topic: getMetadata('topics'),
  };

  const ckgResult = await getDataWithContext(context);
  const { buckets } = ckgResult.queryResults[0].facets[0];

  buckets.forEach((color) => {
    const colorPath = color.canonicalName.split(':')[3].replaceAll('_', '-');
    const colorName = color.displayValue.split(':')[3].replaceAll('_', ' ');

    const buttonContainer = createTag('p', { class: 'button-container' });
    const aTag = createTag('a', {
      class: 'button',
      title: colorName,
      href: window.location.pathname.replace(/\/[^\/]*$/, `/${colorPath}`),
    }, titleCase(colorName));

    buttonContainer.append(aTag);
    block.append(buttonContainer);
  });

  await buildCarousel('.button-container', block);
  block.style.visibility = 'visible';
}
