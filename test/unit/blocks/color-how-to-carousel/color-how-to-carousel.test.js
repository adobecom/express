import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../../express/blocks/color-how-to-carousel/color-how-to-carousel.js');
const testBody = await readFile({ path: './mocks/body.html' });

describe('Color How To Carousel', () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = testBody;
  });

  it('block exists', async () => {
    const block = document.querySelector('.color-how-to-carousel');
    await decorate(block);
    expect(block).to.exist;
  });

  it('schema variant builds schema', async () => {
    const block = document.querySelector('.color-how-to-carousel');
    block.classList.add('schema');
    await decorate(block);
    const schema = document.querySelector('head script[type="application/ld+json"]');
    expect(schema).to.exist;
  });
});
