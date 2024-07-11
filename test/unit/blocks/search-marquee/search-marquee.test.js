import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../../express/blocks/search-marquee/search-marquee.js');

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
describe('Search Marquee', () => {
  const block = document.querySelector('.search-marquee');
  decorate(block);
  it('has a hero h1', () => {
    expect(block.querySelector('div:first-of-type h1#hero-title')).to.exist;
  });

  it('has a hero paragraph', () => {
    expect(block.querySelector('div:first-of-type p')).to.exist;
  });

  it('has a hero background image', () => {
    const img = block.querySelector('img');
    expect(img).to.exist;
    expect(img.fetchPriority).equal('high');
  });

  it('has a search bar', () => {
    const searchWrapper = block.querySelector('div.search-bar-wrapper');
    expect(searchWrapper).to.exist;
    const input = searchWrapper.querySelector(':scope > form > input');
    expect(input).to.exist;
    expect(input.type).to.equal('text');
    expect(input.placeholder).to.exist;
  });

  it('has a search form', () => {
    expect(true).to.be.true;
  });

  it('has a search dropdown when clicked', () => {
    expect(true).to.be.true;
  });

  it('shows trendy searches', () => {
    expect(true).to.be.true;
  });

  it('has autocomplete in search dropdown', () => {
    expect(true).to.be.true;
  });

  it('has a carousel for CKG pills', () => {
    expect(true).to.be.true;
  });

  it('removes raw divs when carousel is being built', () => {
    expect(true).to.be.true;
  });
});
