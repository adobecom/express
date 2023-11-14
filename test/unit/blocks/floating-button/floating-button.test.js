/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../../express/blocks/floating-button/floating-button.js');

describe('Floating Button', () => {
  before(() => {
    window.isTestEnv = true;
    window.hlx = {};
    window.floatingCta = [
      {
        path: 'default',
        live: 'Y',
      },
    ];
    window.placeholders = { 'see-more': 'See More' };
  });

  it('Floating Button exists', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const floatingButton = document.querySelector('.floating-button');
    decorate(floatingButton);
    expect(floatingButton).to.exist;
  });

  it('Floating Button has the right elements and if mobile, .section should be removed', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const floatingButton = document.querySelector('.floating-button');
    decorate(floatingButton);

    const closestSection = floatingButton.closest('.section');
    const blockLinks = floatingButton.querySelectorAll('a');
    expect(closestSection).to.exist;
    expect(document.contains(closestSection)).to.be.false;
    expect(blockLinks).to.exist;
  });

  it('Parent element should be removed if there is no link', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/no-link.html' });
    const floatingButton = document.querySelector('.floating-button');
    decorate(floatingButton);

    const { parentElement } = floatingButton;
    const blockLinks = floatingButton.querySelectorAll('a');
    expect(document.contains(parentElement)).to.be.false;
    expect(blockLinks).to.be.empty;
  });
});
