import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setConfig } from '../../../../express/scripts/utils.js';
import { mockRes } from '../../../blocks/test-utilities.js';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
const conf = { locales };
setConfig(conf);
const { default: decorate } = await import('../../../../express/blocks/simplified-pricing-cards/simplified-pricing-cards.js');
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Pricing Cards', () => {
  let blocks;
  let cardCnts;
  let fetchStub;

  before(async () => {
    window.isTestEnv = true;
    blocks = Array.from(document.querySelectorAll('.simplified-pricing-cards'));
    await Promise.all(blocks.map((block) => decorate(block)));
    fetchStub = sinon.stub(window, 'fetch');
  });

  afterEach(() => {
    // Restore the original functionality after each test
    fetchStub.restore();
  });

  it('Pricing Cards exists', () => {
    expect(blocks.every((block) => !!block.querySelector('div.card'))).to.be.true;
  });

  it(`Card counts to be ${cardCnts}`, () => {
    const cards = document.querySelectorAll('.card');
    expect(cards.length).to.equal(4);
  });

  it('Cards contain necessary elements', () => {
    blocks.forEach((block) => {
      const cardContainer = block.querySelector('div.card-wrapper');
      expect(cardContainer).to.exist;
      const cards = cardContainer.querySelectorAll('.card');

      cards.forEach((card) => {
        expect(card.querySelector('.card-header')).to.exist;
        expect(card.querySelector('.plan-explanation')).to.exist;
        expect(card.querySelector('.pricing-area')).to.exist;
        expect(card.querySelector('.card-cta-group')).to.exist;
      });

      expect(block.querySelectorAll('.compare-all-button')).to.exist;
    });
  });

  it('Special and gradient promo classes are added', () => {
    expect(document.querySelectorAll('.gradient-promo')).to.have.lengthOf.at.least(2);
  });

});
