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
/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
// import {
//   decorate
//   // renderImageOrVideo,
//   // renderGridNode,
//   // decorateLoadMoreButton,
//   // getGradient,
// } from '../../../express/blocks/feature-grid-desktop/feature-grid-desktop.js';

const { default: decorate } = await import('../../../express/blocks/feature-grid-desktop/feature-grid-desktop.js');

document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Feature Grid Desktop', () => {
  before(() => {
    window.isTestEnv = true;
  });
  const featureGrid = document.querySelector('.feature-grid-desktop');
  decorate(featureGrid);
  const cellList = featureGrid.querySelectorAll('.grid-item');

  it('check if Feature Grid block exists', () => {
    expect(featureGrid).to.exist;
  });

  cellList.forEach((cell) => {
    it('each cell has all expected elements', () => {
      expect(cell.querySelector('h2')).to.exist;
      expect(cell.querySelector('p')).to.exist;
      expect(cell.querySelector('.cta')).to.exist;
      expect(cell.querySelector('img, video')).to.exist;
    });
  });

  // it('returns null if video href is empty', () => {
  //   expect(renderImageOrVideo('<a href=""></a>')).to.equal(null);
  // });
});
