/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { createTag } from '../../../express/scripts/scripts.js';

const { default: decorate, decorateFooter } = await import('../../../express/blocks/puf/puf.js');

describe('PUF', () => {
  beforeEach(async () => {
    window.isTestEnv = true;
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
  });

  it('PUF exists', () => {
    const puf = document.querySelector('.puf');
    decorate(puf);
    expect(puf).to.exist;
  });

  it('PUF has a footer', () => {
    const puf = document.querySelector('.puf');
    decorate(puf);

    const blockWith4Children = createTag('div', { class: 'block' });
    for (let i = 0; i < 4; i += 1) {
      blockWith4Children.append(createTag('div', { class: `block_content${i + 1}` }));
    }
    const footer = decorateFooter(blockWith4Children);
    expect(footer).to.be.an.instanceof(HTMLDivElement);
  });

  it('PUF has no footer', () => {
    const blockWithoutChildren = createTag('div', { class: 'block' });
    const footer = decorateFooter(blockWithoutChildren);
    expect(footer).to.be.empty;
  });

  it('Checkbox is checked or not', () => {
    const puf = document.querySelector('.puf');
    decorate(puf);

    const checkbox = document.querySelector('.puf input[type="checkbox"]');
    checkbox.click();
    expect(checkbox.checked).to.be.true;
    checkbox.click();
    expect(checkbox.checked).to.be.false;
  });

  it('CTA contains the right text when <strong> is not found', () => {
    const puf = document.querySelector('.puf');
    const cardTop = puf.children[1].children[0];

    const ctaTextContainers = Array.from(cardTop.querySelectorAll('strong'));
    ctaTextContainers.forEach((ctaTextContainer) => {
      ctaTextContainer.parentNode.removeChild(ctaTextContainer);
    });

    decorate(puf);

    const cardCta = cardTop.querySelector('.button');
    expect(cardCta.textContent).to.equal('Start your trial');
  });

  it('should change slide to 2 on touch move', (done) => {
    const puf = document.querySelector('.puf');

    decorate(puf);
    const carouselContainer = puf.querySelector('.carousel-container');

    setTimeout(() => {
      const startTouch = new Touch({
        identifier: Date.now(),
        target: puf,
        clientX: 100,
        clientY: 100,
      });

      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [startTouch],
        targetTouches: [],
        changedTouches: [startTouch],
      });
      puf.dispatchEvent(touchStartEvent);

      const endTouch = new Touch({
        identifier: Date.now(),
        target: puf,
        clientX: 0,
        clientY: 50,
      });

      setTimeout(() => {
        const touchMoveEvent = new TouchEvent('touchmove', {
          touches: [endTouch],
          targetTouches: [],
          changedTouches: [endTouch],
        });
        puf.dispatchEvent(touchMoveEvent);

        if (carouselContainer.classList.contains('slide-2-selected')) {
          done();
        } else {
          done(new Error('Test failed: slide was not changed'));
        }
      }, 200);
    }, 500);
  });

  it('should change slide to 1 on left arrow click', (done) => {
    const puf = document.querySelector('.puf');

    decorate(puf);
    const carouselContainer = puf.querySelector('.carousel-container');

    setTimeout(() => {
      const leftArrow = carouselContainer.querySelector('.carousel-fader-left');
      leftArrow.click();

      if (carouselContainer.classList.contains('slide-1-selected')) {
        done();
      } else {
        done(new Error('Test failed: slide was not changed'));
      }
    }, 500);
  });

  it('should change slide to 2 on ArrowRight keyup', (done) => {
    const puf = document.querySelector('.puf');

    decorate(puf);
    const carouselContainer = puf.querySelector('.carousel-container');

    setTimeout(() => {
      const event = new KeyboardEvent('keyup', { key: 'ArrowRight' });
      puf.dispatchEvent(event);

      if (carouselContainer.classList.contains('slide-2-selected')) {
        done();
      } else {
        done(new Error('Test failed: slide was not changed'));
      }
    }, 500);
  });

  it('should change slide to 1 on ArrowLeft keyup', (done) => {
    const puf = document.querySelector('.puf');

    decorate(puf);
    const carouselContainer = puf.querySelector('.carousel-container');

    setTimeout(() => {
      const event = new KeyboardEvent('keyup', { key: 'ArrowLeft' });
      puf.dispatchEvent(event);

      if (carouselContainer.classList.contains('slide-1-selected')) {
        done();
      } else {
        done(new Error('Test failed: slide was not changed'));
      }
    }, 500);
  });
});
