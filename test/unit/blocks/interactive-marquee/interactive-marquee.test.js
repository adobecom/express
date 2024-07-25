import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
import { setLibs, loadBlock } from '../../../../express/scripts/utils.js';
import init from '../../../../express/blocks/interactive-marquee/interactive-marquee.js';

describe('interactive marquee', () => {
  const im = document.querySelector('.interactive-marquee');
  before(async () => {
    setLibs('https://milo.adobe.com/libs');
    await init(im);
  });

  it('interactive marquee dakr and horiontal variant should exist', () => {
    expect(im.classList.contains('dark')).to.true;
    expect(im.classList.contains('horizontal')).to.true;
  });

  it('has the interactive-area', () => {
    const container = im.querySelector('.foreground .interactive-container');
    expect(container).to.exist;
  });

  it('has a heading-xxl', () => {
    const heading = im.querySelector('.heading-xxl');
    expect(heading).to.exist;
  });

  it('has an icon area', () => {
    const iconArea = im.querySelector('.icon-area');
    expect(iconArea).to.exist;
  });

  it('should have icon text', () => {
    const iconText = im.querySelector('.icon-text');
    expect(iconText).to.exist;
    expect(iconText.classList.contains('heading-xs')).to.be.true;
  });
});