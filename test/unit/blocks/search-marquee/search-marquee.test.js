import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../../express/blocks/search-marquee/search-marquee.js');

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
describe('Search Marquee', () => {
  const block = document.querySelector('.search-marquee');
  before(async () => {
    window.isTestEnv = true;
    await decorate(block);
  });
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

  it('has search dropdown hidden when loaded', () => {
    const dropdownContainer = block.querySelector('.search-dropdown-container');
    const trendsContainer = dropdownContainer.querySelector('.trends-container');
    const suggestionsContainer = dropdownContainer.querySelector('.suggestions-container');
    expect(dropdownContainer.classList.contains('hidden')).to.be.true;
    expect(trendsContainer).to.exist;
    expect(suggestionsContainer).to.exist;
  });

  it('shows trends when first clicked', () => {
    const dropdownContainer = block.querySelector('.search-dropdown-container');
    const trendsContainer = dropdownContainer.querySelector('.trends-container');
    const suggestionsContainer = dropdownContainer.querySelector('.suggestions-container');
    const input = block.querySelector('form input');
    input.click();
    expect(dropdownContainer.classList.contains('hidden')).to.be.false;
    expect(suggestionsContainer.classList.contains('hidden')).to.be.true;
    expect(trendsContainer.classList.contains('hidden')).to.be.false;
  });
  // TODO: add tests for freePlans, CKG Pills, and search interactions
});
