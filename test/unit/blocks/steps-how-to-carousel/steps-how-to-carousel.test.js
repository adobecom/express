/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../../express/blocks/steps-how-to-carousel/steps-how-to-carousel.js');
const testBody = await readFile({ path: './mocks/body.html' });

describe('Steps How To Carousel', () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = testBody;
  });

  it('block exists', async () => {
    const block = document.querySelector('.steps-how-to-carousel');
    await decorate(block);
    expect(block).to.exist;
  });

  it('schema variant builds schema', async () => {
    const block = document.querySelector('.steps-how-to-carousel');
    block.classList.add('schema');
    await decorate(block);
    const schema = document.querySelector('head script[type="application/ld+json"]');
    expect(schema).to.exist;
  });
});
