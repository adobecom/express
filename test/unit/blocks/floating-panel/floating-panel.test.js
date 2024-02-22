/* eslint-env mocha */
/* eslint-disable no-unused-vars */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../../express/blocks/floating-panel/floating-panel.js');
const testBody = await readFile({ path: './mocks/body.html' });

describe('Floating Panel', () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = testBody;
  });

  it('loading the static state correctly', async () => {
    const block = document.querySelector('.floating-panel');
    await decorate(block);
    expect(block).to.exist;
  });

  it('block reacts to hovering', async () => {
    const block = document.querySelector('.floating-panel');
    await decorate(block);
    block.dispatchEvent(new Event('mouseenter'));

    const timeline = block.querySelector('.timeline');

    expect(timeline.children.length).to.equal(3);
  });
});
