import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import(
  '../../../../express/blocks/grid-marquee/grid-marquee.js'
);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });
describe('grid-marquee', () => {
  let block;
  before(async () => {
    window.placeholders = {
      'app-store-ratings': '4.9, 233.8k ratings; 4.6, 117k ratings; https://adobesparkpost.app.link/GJrBPFUWBBb',
    };
    block = document.querySelector('.grid-marquee');
    decorate(block);
  });
  it('has a background image', async () => {
    const background = block.querySelector('.background');
    expect(background).to.exist;
    expect(background.querySelector('img')).to.exist;
  });
  it('has a foreground', () => {
    const foreground = block.querySelector('.foreground');
    expect(foreground).to.exist;
    expect(foreground.querySelector('.headline')).to.exist;
    expect(foreground.querySelector('.cards-container')).to.exist;
  });
  it('decorates cards', () => {
    const cardsContainer = block.querySelector('.cards-container');
    const cards = [...cardsContainer.querySelectorAll('.card')];
    const drawers = [...block.querySelectorAll('.drawer')];
    expect(cards.length === drawers.length).to.be.true;
    drawers.forEach((drawer) => {
      expect(drawer.querySelector('.title-row')).to.exist;
      expect(drawer.querySelector('.video-container')).to.exist;
      expect(drawer.querySelector('.ctas-container')).to.exist;
    });
  });
  it('expands drawer when interacted', () => {
    const card = block.querySelector('.card');
    const drawer = block.querySelector('.drawer');
    expect(card.getAttribute('aria-expanded')).to.equal('false');
    expect(drawer.getAttribute('aria-hidden')).to.equal('true');
    card.click();
    expect(drawer.getAttribute('aria-hidden')).to.equal('false');
    expect(card.getAttribute('aria-expanded')).to.equal('true');
  });
  it('collapses and expands drawer', () => {
    const card = block.querySelector('.card');
    const drawer = block.querySelector('.drawer');
    card.click();
    expect(drawer.getAttribute('aria-hidden')).to.equal('false');
    expect(card.getAttribute('aria-expanded')).to.equal('true');
    card.querySelector("button[aria-label='close']").click();
    expect(drawer.getAttribute('aria-hidden')).to.equal('true');
    expect(card.getAttribute('aria-expanded')).to.equal('false');
    card.click();
    expect(drawer.getAttribute('aria-hidden')).to.equal('false');
    expect(card.getAttribute('aria-expanded')).to.equal('true');
    block.querySelector('.headline').click();
    expect(drawer.getAttribute('aria-hidden')).to.equal('true');
    expect(card.getAttribute('aria-expanded')).to.equal('false');

    card.dispatchEvent(new Event('mouseenter'));
    expect(drawer.getAttribute('aria-hidden')).to.equal('false');
    expect(card.getAttribute('aria-expanded')).to.equal('true');
    card.querySelector("button[aria-label='close']").click();

    card.dispatchEvent(new Event('focusin'));
    expect(drawer.getAttribute('aria-hidden')).to.equal('false');
    expect(card.getAttribute('aria-expanded')).to.equal('true');
    card.dispatchEvent(new Event('focusout'));
    expect(drawer.getAttribute('aria-hidden')).to.equal('true');
    expect(card.getAttribute('aria-expanded')).to.equal('false');
  });
  it('splits card content by tabs when more than 1 col is authored', () => {
    const card = block.querySelectorAll('.card')[1];
    const drawer = block.querySelectorAll('.drawer')[1];
    card.click();
    const tablist = drawer.querySelector("[role='tablist']");
    expect(tablist).to.exist;
    const tabs = tablist.querySelectorAll("button[role='tab']");
    expect(tabs.length).to.equal(2);
    const panels = drawer.querySelectorAll("[role='tabpanel']");
    expect(panels.length).to.equal(2);
    expect(tabs[0].getAttribute('aria-selected')).to.equal('true');
    expect(tabs[1].getAttribute('aria-selected')).to.equal('false');
    expect(panels[0].getAttribute('aria-hidden')).to.equal('false');
    expect(panels[1].getAttribute('aria-hidden')).to.equal('true');
    tabs[0].click();
    expect(tabs[0].getAttribute('aria-selected')).to.equal('true');
    expect(tabs[1].getAttribute('aria-selected')).to.equal('false');
    expect(panels[0].getAttribute('aria-hidden')).to.equal('false');
    expect(panels[1].getAttribute('aria-hidden')).to.equal('true');
    tabs[1].click();
    expect(tabs[0].getAttribute('aria-selected')).to.equal('false');
    expect(tabs[1].getAttribute('aria-selected')).to.equal('true');
    expect(panels[0].getAttribute('aria-hidden')).to.equal('true');
    expect(panels[1].getAttribute('aria-hidden')).to.equal('false');
  });
  it('displays ratings for ratings variant', () => {
    expect(block.querySelector('.ratings img')).to.exist;
  });
});
