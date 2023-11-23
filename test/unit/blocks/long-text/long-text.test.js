/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import(
  '../../../../express/blocks/long-text/long-text.js'
);

const body = await readFile({ path: './mocks/body.html' });
const noLongTextWrapper = await readFile({ path: './mocks/no-long-text-wrapper.html' });
const longTextWrapper = await readFile({ path: './mocks/long-text-wrapper.html' });

describe('Long Text', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Long Text exists', () => {
    document.body.innerHTML = body;
    const longText = document.querySelector('.long-text');
    decorate(longText);
    expect(longText).to.exist;
  });

  it('Long Text contains the right elements if block contains plain class', () => {
    document.body.innerHTML = body;
    const longText = document.querySelector('.long-text');
    decorate(longText);

    const plain = document.querySelector('.plain');
    expect(plain).to.exist;
    expect(plain.classList.contains('plain')).to.be.true;
  });

  it('Empty text content parent without long-text-wrapper should be removed', () => {
    document.body.innerHTML = noLongTextWrapper;
    const longText = document.querySelector('.long-text');
    decorate(longText);

    const removedBlock = document.querySelector('.long-text');
    expect(removedBlock).to.not.exist;
  });

  it('Empty Content parent element removed if it contains long-text-wrapper', () => {
    document.body.innerHTML = longTextWrapper;
    const longText = document.querySelector('.long-text');
    decorate(longText);

    const removedParentElement = document.querySelector('.long-text-wrapper');
    expect(removedParentElement).to.not.exist;
  });
});
