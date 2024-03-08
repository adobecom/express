import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setConfig } from '../../../../express/utils/utils.js';
import { mockRes } from '../../../blocks/test-utilities.js';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
const conf = { locales };
setConfig(conf);
const { default: decorate } = await import('../../../../express/blocks/pricing-cards/pricing-cards.js');
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Pricing Cards', () => {
  let blocks;
  let cardCnts;
  let fetchStub;

  before(async () => {
    window.isTestEnv = true;
    blocks = Array.from(document.querySelectorAll('.pricing-cards'));
    await Promise.all(blocks.map((block) => decorate(block)));
    cardCnts = (document.querySelector('div.card-cnts').textContent.split(',')).map((cnt) => parseInt(cnt, 10));
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
    const cards = document.querySelectorAll('.pricing-cards');
    expect(cards.length).to.equal(cardCnts.length);
    cards.forEach((card, i) => {
      expect(card.querySelectorAll('div.card').length).to.equal(cardCnts[i]);
    });
  });

  it('Cards contain necessary elements', () => {
    blocks.forEach((block) => {
      const cardContainer = block.querySelector('div.cards-container');
      expect(cardContainer).to.exist;
      const cards = cardContainer.querySelectorAll('div.card-border');

      cards.forEach((card) => {
        expect(card.querySelector('.card-header')).to.exist;
        expect(card.querySelector('.card-explain')).to.exist;
        expect(card.querySelector('.pricing-area')).to.exist;
        expect(card.querySelector('.card-cta-group')).to.exist;
        expect(card.querySelector('.card-feature-list')).to.exist;
        expect(card.querySelectorAll('.card-compare')).to.exist;
      });
    });
  });

  it('Special and gradient promo classes are added', () => {
    expect(document.querySelectorAll('.special-promo')).to.have.lengthOf.at.least(1);
    expect(document.querySelectorAll('.gradient-promo')).to.have.lengthOf.at.least(1);
  });

  it('Expect the eyebrow / promo border of an offer with a null ID to be suppressed', async () => {
    fetchStub.onCall(0).callsFake(() => mockRes({
      payload: {
        data: [
          {
            Key: 'free-plan-check-1',
            Text: 'Free use forever',
          },
          {
            Key: 'free-plan-check-2',
            Text: 'No credit card required',
          },
        ],
      },
    }));
    document.body.innerHTML = await readFile({ path: './mocks/pricingTests.html' });
    blocks = Array.from(document.querySelectorAll('.pricing-cards'));
    await Promise.all(blocks.map((block) => decorate(block)));
    expect(document.querySelectorAll('.special-promo')).to.have.lengthOf.at.least(0);
  });
  // TODO: add checks for pricing logic
  // TODO: add checks for optional/configurable elements
  // TODO: add checks for BlockMediator
});
