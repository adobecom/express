/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../../express/blocks/banner/banner.js');

const body = await readFile({ path: './mocks/body.html' });
const light = await readFile({ path: './mocks/light.html' });
const standout = await readFile({ path: './mocks/standout.html' });
const multiButton = await readFile({ path: './mocks/multi-button.html' });

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
  });

  it('Banner standout variant has correct elements', () => {
    document.body.innerHTML = standout;
    const banner = document.querySelector('.banner');
    decorate(banner);

    const contentContainer = banner.querySelector('.content-container');
    expect(contentContainer).to.exist;

    const button = banner.querySelector('a.button');

    ['large', 'primary'].forEach((className) => {
      expect(button.classList.contains(className)).to.be.true;
    });

    ['accent', 'reverse'].forEach((className) => {
      expect(button.classList.contains(className)).to.be.false;
    });
  });

  it('creates a Banner cool variant block with correct elements', () => {
    document.body.innerHTML = cool;
    const banner = document.querySelector('.banner');
    decorate(banner);

    const contentContainer = banner.querySelector('.content-container');
    expect(contentContainer).to.exist;

    const button = banner.querySelector('a.button');

    ['large', 'primary'].forEach((className) => {
      expect(button.classList.contains(className)).to.be.true;
    });

    ['accent', 'reverse'].forEach((className) => {
      expect(button.classList.contains(className)).to.be.false;
    });
  });

  it('Banner light variant has correct elements', () => {
    document.body.innerHTML = light;
    const banner = document.querySelector('.banner');
    decorate(banner);

    const button = banner.querySelector('a.button');

    ['large', 'primary', 'reverse'].forEach((className) => {
      expect(button.classList.contains(className)).to.be.true;
    });

    expect(button.classList.contains('accent')).to.be.false;
  });

  it('Banner dark variant has correct elements', () => {
    document.body.innerHTML = body;
    const banner = document.querySelector('.banner');
    decorate(banner);

    const button = banner.querySelector('a.button');

    ['dark', 'accent'].forEach((className) => {
      expect(button.classList.contains(className)).to.be.true;
    });
  });

  it('Banner multi-button has correct elements', () => {
    document.body.innerHTML = multiButton;
    const banner = document.querySelector('.banner');
    decorate(banner);

    const button = banner.querySelector('a.button');
    expect(button.classList.contains('reverse')).to.be.true;
    const buttons = banner.querySelectorAll('a.button');
    expect(buttons.length).to.be.at.least(2);
  });

  it('If phone number exists', () => {
    document.body.innerHTML = body;
    const banner = document.querySelector('.banner');
    decorate(banner);

    const phoneNumber = banner.querySelector('a[title="{{business-sales-numbers}}"]');
    expect(phoneNumber).to.exist;
  });
});
