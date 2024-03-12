import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import BlockMediator from '../../../../express/scripts/block-mediator.min.js';

const { default: decorate } = await import(
  '../../../../express/blocks/billing-radio/billing-radio.js'
);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

const isButtonChecked = (button) => button.classList.contains('checked');

describe('Billing Radio', () => {
  let blocks;
  before(async () => {
    window.isTestEnv = true;
    blocks = Array.from(document.querySelectorAll('.billing-radio'));
    blocks.forEach((block) => decorate(block));
  });

  it('Billing Radio exists', () => {
    expect(blocks.every((block) => !!block)).to.be.true;
  });
  it('Billing Radio element structure is correct', () => {
    blocks.forEach((block) => {
      const strong = block.querySelector('strong');
      expect(strong).to.exist;
      const options = block.querySelectorAll(':scope > button');
      options.forEach((option) => {
        const circle = option.querySelector('span');
        expect(circle).to.exist;
        expect(option.textContent.trim()).to.not.be.empty;
      });
    });
  });
  it('Billing Radio has 1st checked', () => {
    blocks.forEach((block) => {
      block.querySelectorAll('button').forEach((button, index) => {
        expect(isButtonChecked(button)).to.equal(index === 0);
      });
    });
  });
  it('Billing Radio initializes BlockMediator billing-plan store', () => {
    expect(BlockMediator.hasStore('billing-plan')).to.be.true;
    expect(BlockMediator.get('billing-plan')).to.equal(0);
  });
  it('Billing Radio changes after clicking', () => {
    blocks[0].querySelectorAll('button')[1].click();
    blocks.forEach((block) => {
      block.querySelectorAll('button').forEach((button, index) => {
        expect(isButtonChecked(button)).to.equal(index === 1);
      });
    });
    expect(BlockMediator.get('billing-plan')).to.equal(1);

    blocks[2].querySelectorAll('button')[2].click();
    blocks.forEach((block) => {
      block.querySelectorAll('button').forEach((button, index) => {
        expect(isButtonChecked(button)).to.equal(index === 2);
      });
    });
    expect(BlockMediator.get('billing-plan')).to.equal(2);
  });
  it('Billing Radio propagate changes via BlockMediator', async () => {
    let triggered = 0;
    const unsub = BlockMediator.subscribe('billing-plan', () => {
      triggered += 1;
    });
    expect(triggered).to.equal(0);
    blocks[0].querySelectorAll('button')[0].click();
    expect(triggered).to.equal(1);
    blocks[1].querySelectorAll('button')[1].click();
    expect(triggered).to.equal(2);
    blocks[0].querySelectorAll('button')[1].click();
    expect(triggered).to.equal(2);
    unsub();
  });

  // TODO: implement mocking for BlockMediator
});
