import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import buildGallery from '../../../../express/features/gallery/gallery.js';
import { delay } from '../../../helpers/waitfor.js';

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
describe('gallery', () => {
  const oldIO = window.IntersectionObserver;
  let fire;
  beforeEach(() => {
    const mockIntersectionObserver = class {
      items = [];

      constructor(cb) {
        fire = cb;
      }

      observe(item) {
        this.items.push(item);
      }
    };
    window.IntersectionObserver = mockIntersectionObserver;
  });
  after(() => {
    window.IntersectionObserver = oldIO;
  });
  it('handles irregular inputs', () => {
    expect(() => buildGallery()).to.throw;
  });
  it('decorates items into gallery', async () => {
    const root = document.querySelector('.how-to-cards');
    const container = root.querySelector('.cards-container');
    const items = [...root.querySelectorAll('.card')];
    await buildGallery(items, container, root);
    expect(container.classList.contains('gallery')).to.be.true;
    items.forEach((item) => {
      expect(item.classList.contains('gallery--item')).to.be.true;
    });
    fire([
      {
        target: items[0],
        isIntersecting: true,
      },
      { target: items[1], isIntersecting: true },
    ]);
    await delay(310);
    expect(items.findIndex((item) => item.classList.contains('curr'))).to.equal(0);
    const control = root.querySelector('.gallery-control');
    expect(control).to.exist;
    const prev = control.querySelector('button.prev');
    const next = control.querySelector('button.next');
    expect(prev).to.exist;
    expect(next).to.exist;
    expect(prev.disabled).to.be.true;
    expect(next.disabled).to.be.false;
  });
  it('swaps page', async () => {
    const items = [...document.querySelectorAll('.card')];
    const control = document.querySelector('.gallery-control');
    fire([
      {
        target: items[0],
        isIntersecting: false,
      },
      { target: items[2], isIntersecting: true },
    ]);
    await delay(310);
    expect(items.findIndex((item) => item.classList.contains('curr'))).to.equal(1);
    const prev = control.querySelector('button.prev');
    const next = control.querySelector('button.next');
    expect(prev.disabled).to.be.false;
    const dots = [...control.querySelectorAll('.dot')];
    expect(dots.reduce((cnt, dot) => {
      if (!dot.classList.contains('hide')) {
        return cnt + 1;
      }
      return cnt;
    }, 0)).to.equal(4); // 4 total pages
    fire([
      {
        target: items[0],
        isIntersecting: true,
      },
      { target: items[3], isIntersecting: true },
      { target: items[4], isIntersecting: true },
    ]);
    await delay(310);
    expect(items.findIndex((item) => item.classList.contains('curr'))).to.equal(0);
    expect(prev.disabled).to.be.true;
    expect(next.disabled).to.be.true;
    expect(control.classList.contains('hide'));
    const container = document.querySelector('.cards-container');
    expect(container.classList.contains('gallery--all-displayed'));
  });
});
