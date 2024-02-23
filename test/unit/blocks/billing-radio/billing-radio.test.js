import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import resetBlockMediator from '../../../helpers/reset-block-mediator.js';

const { default: decorate } = await import(
  '../../../../express/blocks/billing-radio/billing-radio.js'
);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Billing Radio', () => {
  let blocks;
  before(async () => {
    window.isTestEnv = true;
    resetBlockMediator();
    blocks = Array.from(document.querySelectorAll('.billing-radio'));
    blocks.forEach((block) => decorate(block));
  });

  it('Billing Radio exists', () => {
    expect(blocks.every((block) => !!block)).to.be.true;
  });
  it('Billing Radio uses incremental id when multiple on same page', () => {
    expect(
      blocks.every((block, i) => [...block.querySelectorAll('input[type=radio]')].every((radio) => radio.name === `billing-${i}`)),
    ).to.be.true;
  });
  it('Billing Radio element structure is correct', () => {
    blocks.forEach((block, i) => {
      const strong = block.querySelector('strong');
      expect(strong).to.exist;
      const options = block.querySelectorAll(':scope > div');
      expect(options).to.have.lengthOf(i === 2 ? 4 : 2);
      options.forEach((option) => {
        const input = option.querySelector('input');
        expect(input).to.exist;
        expect(input.type).to.equal('radio');
        const label = option.querySelector('label');
        expect(label).to.exist;
        expect(label.textContent.trim()).to.not.be.empty;
      });
    });
  });
  it('Billing Radio has 1st checked', () => {
    blocks.forEach((block) => {
      block.querySelectorAll('input').forEach((input, index) => {
        expect(input.checked).to.equal(index === 0);
      });
    });
  });
  it('Billing Radio initializes BlockMediator billing-plan store', () => {
    expect(window.bmd8r.hasStore('billing-plan')).to.be.true;
    expect(window.bmd8r.get('billing-plan')).to.equal(0);
  });
  it('Billing Radio changes after clicking', () => {
    blocks[0].querySelectorAll('input')[1].click();
    blocks.forEach((block) => {
      block.querySelectorAll('input').forEach((input, index) => {
        expect(input.checked).to.equal(index === 1);
      });
    });
    expect(window.bmd8r.get('billing-plan')).to.equal(1);

    blocks[2].querySelectorAll('input')[2].click();
    blocks.forEach((block) => {
      block.querySelectorAll('input').forEach((input, index) => {
        expect(input.checked).to.equal(index === 2);
      });
    });
    expect(window.bmd8r.get('billing-plan')).to.equal(2);
  });
  it('Billing Radio propagate changes via BlockMediator', async () => {
    let triggered = 0;
    const unsub = window.bmd8r.subscribe('billing-plan', () => {
      triggered += 1;
    });
    expect(triggered).to.equal(0);
    blocks[0].querySelectorAll('input')[0].click();
    expect(triggered).to.equal(1);
    blocks[1].querySelectorAll('input')[1].click();
    expect(triggered).to.equal(2);
    blocks[0].querySelectorAll('input')[1].click();
    expect(triggered).to.equal(2);
    unsub();
  });

  // TODO: implement mocking for BlockMediator
});
