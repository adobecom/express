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

const { default: decorate } = await import('../../../express/blocks/feature-grid-desktop/feature-grid-desktop.js');
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Feature Grid Desktop', async () => {
  const smallGrid = document.querySelector('#small-grid');
  const oversizedGrid = document.querySelector('#over-sized-grid');
  const noGradientBlock = document.querySelector('#no-gradient');
  // console.log(noGradientBlock);
  const cellList = document.querySelectorAll('#full-grid .grid-item');
  let loadMoreButton;
  let fullGrid;
  before(() => {
    window.isTestEnv = true;
    decorate(smallGrid);
    decorate(noGradientBlock);
  });

  beforeEach(async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    fullGrid = document.querySelector('#full-grid');
    decorate(fullGrid);
    loadMoreButton = document.querySelector('#full-grid .load-more-button');
  });

  it('check if Feature Grid block exists', () => {
    expect(smallGrid).to.exist;
  });

  cellList.forEach((cell) => {
    it('each cell has all expected elements', () => {
      expect(cell.querySelector('h2')).to.exist;
      expect(cell.querySelector('p')).to.exist;
      expect(cell.querySelector('.cta')).to.exist;
      expect(cell.querySelector('img, video')).to.exist;
    });
  });

  it('gives an error message if too many cells are passed in', () => {
    expect(() => decorate(oversizedGrid)).to.throw('Authoring issue: Feature Grid Fixed block should have 12 children. Received: 14');
  });

  it('adds the expanded class to the block when "Load More" is clicked', () => {
    loadMoreButton.click();
    expect(Object.values(fullGrid.classList)).to.include('expanded');
  });

  it('adds the authored color to the background gradient of the "load-more" section when clicked', async () => {
    const loadMoreDiv = fullGrid.querySelector('.load-more-div');
    loadMoreButton.click();
    loadMoreButton.click();
    expect(loadMoreDiv.style.background).to.equal('linear-gradient(rgba(255, 255, 255, 0), rgb(252, 250, 255), rgb(252, 250, 255))');
  });

  it('leaves gradient blank if none authored', () => {
    const loadMoreDiv = noGradientBlock.querySelector('.load-more-div');
    loadMoreButton.click();
    loadMoreButton.click();
    expect(loadMoreDiv.style.background).to.equal('');
  });

  it('Allows author to control text in the "load more" button', () => {
    expect(loadMoreButton.textContent).to.equal('Explore more Adobe Express features');
    loadMoreButton.click();
    expect(loadMoreButton.textContent).to.equal('View less');
  });
});
