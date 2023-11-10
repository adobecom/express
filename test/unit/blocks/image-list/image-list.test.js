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
