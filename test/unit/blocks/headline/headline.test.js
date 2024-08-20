import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { spy } from 'sinon';

const { default: decorate } = await import('../../../../express/blocks/headline/headline.js');
document.body.innerHTML = await readFile({ path: './mocks/body.html' });
describe('Headline', () => {
  let oldLana;
  let lanaSpy;
  before(() => {
    oldLana = window.lana;
    window.lana = { log: () => {} };
    lanaSpy = spy(window.lana, 'log');
  });
  after(() => {
    window.lana = oldLana;
  });
  it('adds style to headline elements', () => {
    for (let i = 1; i <= 3; i += 1) {
      const headline = decorate(document.getElementById(`headline-ut-${i}`)).querySelector(`h${i}`);
      expect(headline.style.fontSize).to.equal(`${i}rem`);
      expect(headline.style.paddingTop).to.equal(`${i}rem`);
      expect(headline.style.paddingBottom).to.equal(`${i}rem`);
      expect(headline.parentElement.firstElementChild === headline.parentElement.lastElementChild);
    }
  });
  it('works without config', () => {
    const headline = decorate(document.getElementById('headline-ut-no-cfg')).querySelector('h4');
    expect(headline).to.exist;
    expect(headline.parentElement.firstElementChild)
      .to.equal(headline.parentElement.firstElementChild);
  });
  it('leaves only headline when config fails', () => {
    const headline = decorate(document.getElementById('headline-ut-bad-cfg')).querySelector('h5');
    expect(headline.parentElement.firstElementChild)
      .to.equal(headline.parentElement.firstElementChild);
    expect(lanaSpy.calledOnce).to.be.true;
    expect(lanaSpy.calledTwice).to.be.false;
  });
});
