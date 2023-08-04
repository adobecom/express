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
  before(() => {
    window.isTestEnv = true;
  });

  describe('Small Grid', () => {
    const smallGrid = document.querySelector('#small-grid');
    decorate(smallGrid);

    it('has a heading', () => {
      const heading = smallGrid.querySelector('.heading > h1');
      expect(heading).to.exist;
    });

    it('has subtext in the heading', () => {
      const subtext = smallGrid.querySelector('.heading > p');
      expect(subtext).to.exist;
    });

    it('has all correct elements in each cell', () => {
      const cellList = smallGrid.querySelectorAll('.grid-item');
      cellList.forEach((cell) => {
        expect(cell.querySelector('h2')).to.exist;
        expect(cell.querySelector('p')).to.exist;
        expect(cell.querySelector('.cta')).to.exist;
        expect(cell.querySelector('img, video')).to.exist;
      });
    });
  });

  describe('Full Grid', () => {
    let fullGrid;
    let loadMoreButton;
    beforeEach(async () => {
      document.body.innerHTML = await readFile({ path: './mocks/body.html' });
      fullGrid = document.querySelector('#full-grid');
      decorate(fullGrid);
      loadMoreButton = fullGrid.querySelector('.load-more-button');
    });

    it('has a heading', () => {
      const heading = fullGrid.querySelector('.heading > h1');
      expect(heading).to.exist;
    });

    it('has subtext in the heading', () => {
      const subtext = fullGrid.querySelector('.heading > p');
      expect(subtext).to.exist;
    });

    it('has all correct elements in each cell', () => {
      const cellList = document.querySelectorAll('#full-grid .grid-item');
      cellList.forEach((cell) => {
        expect(cell.querySelector('h2')).to.exist;
        expect(cell.querySelector('p')).to.exist;
        expect(cell.querySelector('.cta')).to.exist;
        expect(cell.querySelector('img, video')).to.exist;
      });
    });

    it('adds the expanded class to the block when "Load More" is clicked', () => {
      loadMoreButton.click();
      expect(fullGrid.classList.contains('expanded')).to.be.true;
    });

    it('adds the authored color back to the background gradient of the "load-more" section when toggled off/on again', async () => {
      const loadMoreDiv = fullGrid.querySelector('.load-more-div');
      loadMoreButton.click();
      loadMoreButton.click();
      expect(loadMoreDiv.style.background).to.equal('linear-gradient(rgba(255, 255, 255, 0), rgb(252, 250, 255), rgb(252, 250, 255))');
    });

    it('has the correct text in the "Load more" button', () => {
      expect(loadMoreButton.textContent).to.equal('Explore more Adobe Express features');
      loadMoreButton.click();
      expect(loadMoreButton.textContent).to.equal('View less');
    });
  });

  describe('Oversized Grid', () => {
    const oversizedGrid = document.querySelector('#over-sized-grid');
    it('gives an error message if too many cells are passed in', () => {
      expect(() => decorate(oversizedGrid)).to.throw('Authoring issue: Feature Grid Fixed block should have 12 children. Received: 14');
    });
  });

  describe('Unauthored gradient', () => {
    it('leaves gradient blank if none authored (styled by CSS)', () => {
      const noGradientGrid = document.querySelector('#no-gradient');
      decorate(noGradientGrid);
      const loadMoreButton = noGradientGrid.querySelector('.load-more-button');
      const loadMoreDiv = noGradientGrid.querySelector('.load-more-div');
      loadMoreButton.click();
      loadMoreButton.click();
      expect(loadMoreDiv.style.background).to.equal('');
    });
  });
});
