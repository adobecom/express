import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setConfig } from '../../../../express/scripts/utils.js';
import { mockRes } from '../../../blocks/test-utilities.js';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
const conf = { locales };
setConfig(conf);
const { default: decorate } = await import('../../../../express/blocks/logo-row/logo-row.js');
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Logo Row', () => {
  let blocks;
  let cardCnts = 5;
  let fetchStub;

  before(async () => {
    window.isTestEnv = true;
    blocks = Array.from(document.querySelectorAll('.logo-row'));
    await Promise.all(blocks.map((block) => decorate(block))); 
    fetchStub = sinon.stub(window, 'fetch');
  });

  afterEach(() => {
    // Restore the original functionality after each test
    fetchStub.restore();
  });

  it('Logo Row exists', () => {
    expect(Array.from(document.querySelectorAll(".text-column")).length === 1)
  });

  it(`Card counts to be ${cardCnts}`, () => {
    const cards = document.querySelectorAll('.image-column>picture');
    expect(cards.length === cardCnts.length);
  });
});
