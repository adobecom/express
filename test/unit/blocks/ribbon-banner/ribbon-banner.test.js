import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { setConfig } from '../../../../express/scripts/utils.js';

setConfig({});

const { default: decorate } = await import(
  '../../../../express/blocks/ribbon-banner/ribbon-banner.js'
);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });
describe('ribbon-banner', () => {
  let blocks;
  before(() => {
    blocks = document.querySelectorAll('.ribbon-banner');
    blocks.forEach(decorate);
  });
  it('adds all required classes', () => {
    blocks.forEach((block) => {
      expect(block.querySelector('.content')).to.exist;
      expect(block.querySelector('a.button.reverse')).to.exist;
    });
  });
  it('removes config rows', () => {
    blocks.forEach((block) => {
      expect(block.querySelectorAll(':scope > div').length).to.equal(1);
    });
  });
  it('decorates keywords', () => {
    expect(blocks[0].querySelector('strong').style.getPropertyValue('color')).to.equal('rgb(250, 15, 0)');
    expect(blocks[2].querySelector('strong').style.getPropertyValue('color')).to.equal('');
  });
  it('decorates background', () => {
    expect(blocks[0].style.getPropertyValue('background')).to.equal('rgb(0, 0, 0)');
    expect(blocks[2].style.getPropertyValue('background')).to.equal('linear-gradient(97.82deg, rgb(255, 71, 123) 3.22%, rgb(92, 92, 224) 52.58%, rgb(49, 143, 255) 101.72%)');
  });
});
