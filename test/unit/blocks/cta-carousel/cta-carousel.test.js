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
/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../express/blocks/cta-carousel/cta-carousel.js');
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('CTA Carousel', async () => {
  before(() => {
    window.isTestEnv = true;
  });

  describe('Create Variant', () => {
    const createVariant = document.getElementById('create-variant');
    decorate(createVariant);

    it('has a heading', () => {
      const heading = createVariant.querySelector('.cta-carousel-heading-section h2, h3, h4, h5 ,h6');
      expect(heading).to.exist;
    });

    it('has subtext in the heading', () => {
      const subtext = createVariant.querySelector('.cta-carousel-heading-section p');
      expect(subtext).to.exist;
    });
  });

  describe('Quick Action Variant', () => {
    const qaVariant = document.getElementById('qa-variant');
    decorate(qaVariant);
  });

  describe('Gen AI variant', () => {
    const gaVariant = document.getElementById('ga-variant');
    decorate(gaVariant);
  });

  describe('Quick Action + Gen AI combo', () => {
    const qgVariant = document.getElementById('qa-ga-variant');
    decorate(qgVariant);
  });

  describe('Gen AI + Upload Combo', () => {
    const guVariant = document.getElementById('ga-upload-variant');
    decorate(guVariant);
  });
});
