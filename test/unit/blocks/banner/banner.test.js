/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../../express/blocks/banner/banner.js');

const body = await readFile({ path: './mocks/body.html' });
const light = await readFile({ path: './mocks/light.html' });

describe('Banner', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Banner exists', () => {
    document.body.innerHTML = body;
    const banner = document.querySelector('.banner');
    decorate(banner);
    expect(banner).to.exist;
  });

  it('Banner has correct elements', () => {
    document.body.innerHTML = body;
    const banner = document.querySelector('.banner');
    decorate(banner);

    const heading = banner.querySelector('h2');
    const button = banner.querySelector('a.button');
    expect(heading).to.exist;
    expect(button).to.exist;

    // if more than 1 one CTA
    const buttons = banner.querySelectorAll('a.button');
    expect(buttons.length).to.be.at.least(2);
  });

  it('Banner light variant has correct elements', () => {
    document.body.innerHTML = light;
    const banner = document.querySelector('.banner');
    decorate(banner);

    const button = banner.querySelector('a.button');
    // console.log(button)
    // expect(button).to.include('.multi-button');
  });
});
