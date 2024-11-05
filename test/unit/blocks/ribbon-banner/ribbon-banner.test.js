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
      expect(block.querySelector('.row')).to.exist;
      expect(block.querySelector('a.button.reverse')).to.exist;
    });
  });
});
