/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../../express/blocks/cards/cards.js');
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Cards', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Cards exists', () => {
    const cards = document.querySelector('.cards');
    decorate(cards);
    expect(cards).to.exist;
  });

  it('Cards has the correct elements', () => {
    expect(document.querySelector('.card')).to.exist;
    // If img
    expect(document.querySelector('.card-image')).to.exist;
    // If not img
    expect(document.querySelector('.card-content')).to.exist;
  });

  it('If text content starts with https://, create a card wrapper', () => {
    expect(document.querySelector('a')).to.exist;
    expect(document.querySelector('a.card')).to.exist;
  });
});
