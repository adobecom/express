/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../../express/blocks/feature-grid/feature-grid.js');
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

        const backgroundColor = window.getComputedStyle(cell).getPropertyValue('background-color');
        expect(backgroundColor).to.equal('rgb(255, 255, 255)');
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

        const backgroundImage = window.getComputedStyle(cell).getPropertyValue('background-image');
        expect(backgroundImage).to.not.equal('none');
      });
    });

    it('adds the expanded class to the block when "Load More" is clicked', () => {
      loadMoreButton.click();
      expect(fullGrid.classList.contains('expanded')).to.be.true;
    });

    it('has the correct text in the "Load more" button', () => {
      expect(loadMoreButton.textContent).to.equal('Explore more Adobe Express features');
      loadMoreButton.click();
      expect(loadMoreButton.textContent).to.equal('View less');
    });
  });
});
