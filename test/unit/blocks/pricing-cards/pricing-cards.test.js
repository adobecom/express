import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../../express/blocks/pricing-cards/pricing-cards.js');
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Pricing Cards', () => {
  let blocks;
  let cardCnts;
  before(async () => {
    window.isTestEnv = true;
    blocks = Array.from(document.querySelectorAll('.pricing-cards'));
    blocks.forEach((block) => decorate(block));
    cardCnts = (document.querySelector('div.card-cnts').textContent.split(',')).map((cnt) => parseInt(cnt, 10));
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
      const cards = cardContainer.querySelectorAll('div.card');
      cards.forEach((card) => {
        expect(card.querySelector('div.card-header')).to.exist;
        expect(card.querySelector('div.card-explain')).to.exist;
        expect(card.querySelector('div.card-pricing')).to.exist;
        expect(card.querySelector('div.card-cta-group')).to.exist;
        expect(card.querySelector('div.card-feature-list')).to.exist;
        expect(card.querySelector('div.card-compare')).to.exist;
      });
    });
  });
  // TODO: add checks for pricing logic
  // TODO: add checks for optional/configurable elements
});
