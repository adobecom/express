/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import(
  '../../../../express/blocks/wayfinder/wayfinder.js'
);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Wayfinder', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Wayfinder exists', () => {
    const wayfinder = document.querySelector('.wayfinder');
    decorate(wayfinder);
    expect(wayfinder).to.exist;
  });

  it('Wayfinder has correct elements', () => {
    expect(document.querySelector('.cta-row')).to.exist;
    expect(document.querySelector('.text-row')).to.exist;
  });
});
