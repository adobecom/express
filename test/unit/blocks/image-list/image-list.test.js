/*
 * Copyright 2021 Adobe. All rights reserved.
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
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../../express/blocks/image-list/image-list.js');

describe('Image List', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Image List exists', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const imageList = document.querySelector('.image-list');
    decorate(imageList);
    expect(imageList).to.exist;
  });

  it('If third cell, it should be removed', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/third-cell.html' });
    const imageList = document.querySelector('.image-list');
    decorate(imageList);

    const thirdCell = imageList.querySelector('div > div:nth-child(3)');
    expect(thirdCell).to.be.null;
  });

  it('If second cell has no anchor, it should be removed', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/second-cell-no-anchor.html' });
    const imageList = document.querySelector('.image-list');
    decorate(imageList);

    const secondCell = imageList.querySelector('div > div:nth-child(2)');
    expect(secondCell).to.be.null;
  });
});
