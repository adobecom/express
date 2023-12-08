/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const clock = sinon.useFakeTimers({ shouldAdvanceTime: true });
const { default: decorate, hideFader, showFader } = await import(
  '../../../express/blocks/shared/carousel.js'
);

const basicCarousel = await readFile({ path: './mocks/carousel.html' });
const narrowCarousel = await readFile({ path: './mocks/narrow-carousel.html' });
const doubleCarousel = await readFile({ path: './mocks/double-carousel.html' });

describe('Default Carousel - General Tests', () => {
  before(() => {
    window.isTestEnv = true;
    document.body.innerHTML = basicCarousel;
    const carousel = document.querySelector('#create-carousel');
    decorate('', carousel);
  });

  it('Intersection observer triggers exist', async () => {
    await clock.nextAsync();

    const rightTrigger = document.querySelector('.carousel-right-trigger');
    expect(rightTrigger).to.exist;
    const leftTrigger = document.querySelector('.carousel-left-trigger');
    expect(leftTrigger).to.exist;
  });

  it('arrows buttons scroll carousel platform', async () => {
    await clock.nextAsync();

    const platform = document.querySelector('.carousel-platform');
    expect(platform).to.exist;
    const rightFader = document.querySelector('.carousel-container .carousel-fader-right');
    expect(rightFader).to.exist;
    const leftFader = document.querySelector('.carousel-container .carousel-fader-left');
    expect(leftFader).to.exist;

    const scrollPos1 = platform.scrollLeft;

    rightFader.click();
    const scrollPos2 = platform.scrollLeft;
    expect(scrollPos1).to.be.below(scrollPos2);

    leftFader.click();
    const scrollPos3 = platform.scrollLeft;
    expect(scrollPos3).to.be.below(scrollPos2);
  });

  it('hide fader function removes fader elements', async () => {
    await clock.nextAsync();

    const platform = document.querySelector('.carousel-platform');
    expect(platform).to.exist;
    const leftFader = document.querySelector('.carousel-container .carousel-fader-left');
    expect(leftFader).to.exist;

    expect(platform.classList.contains('left-fader')).to.be.false;
    expect(leftFader.classList.contains('arrow-hidden')).to.be.true;
    showFader(leftFader);
    expect(platform.classList.contains('left-fader')).to.be.true;
    expect(leftFader.classList.contains('arrow-hidden')).to.be.false;
  });

  it('show fader function adds fader elements', async () => {
    await clock.nextAsync();

    const platform = document.querySelector('.carousel-platform');
    expect(platform).to.exist;
    const rightFader = document.querySelector('.carousel-container .carousel-fader-right');
    expect(rightFader).to.exist;

    expect(platform.classList.contains('right-fader')).to.be.true;
    expect(rightFader.classList.contains('arrow-hidden')).to.be.false;
    hideFader(rightFader);
    expect(platform.classList.contains('right-fader')).to.be.false;
    expect(rightFader.classList.contains('arrow-hidden')).to.be.true;
  });
});

describe('Infinity Scroll Carousel', () => {
  before(() => {
    window.isTestEnv = true;
    document.body.innerHTML = basicCarousel;
    const carousel = document.querySelector('#create-carousel');
    decorate('', carousel, { infinityScrollEnabled: true });
  });

  it('Intersection observer triggers do not exist', async () => {
    await clock.nextAsync();

    const rightTrigger = document.querySelector('.carousel-right-trigger');
    expect(rightTrigger).to.not.exist;
    const leftTrigger = document.querySelector('.carousel-left-trigger');
    expect(leftTrigger).to.not.exist;
  });

  it('Both faders visible', async () => {
    await clock.nextAsync();

    const platform = document.querySelector('.carousel-platform');
    expect(platform).to.exist;
    const leftFader = document.querySelector('.carousel-container .carousel-fader-left');
    expect(leftFader).to.exist;
    const rightFader = document.querySelector('.carousel-container .carousel-fader-right');
    expect(rightFader).to.exist;

    expect(platform.classList.contains('left-fader')).to.be.true;
    expect(platform.classList.contains('right-fader')).to.be.true;
    expect(leftFader.classList.contains('arrow-hidden')).to.be.false;
    expect(rightFader.classList.contains('arrow-hidden')).to.be.false;
  });

  it('Arrow buttons scroll infinity carousel', async () => {
    await clock.nextAsync();

    const platform = document.querySelector('.carousel-platform');
    expect(platform).to.exist;
    const rightFader = document.querySelector('.carousel-container .carousel-fader-right');
    expect(rightFader).to.exist;
    const leftFader = document.querySelector('.carousel-container .carousel-fader-left');
    expect(leftFader).to.exist;

    const scrollPos1 = platform.scrollLeft;

    rightFader.click();
    const scrollPos2 = platform.scrollLeft;
    expect(scrollPos1).to.be.below(scrollPos2);

    leftFader.click();
    const scrollPos3 = platform.scrollLeft;
    expect(scrollPos3).to.be.below(scrollPos2);
  });
});

describe('Compare Standard Carousel To Infinity Scroll Carousel', () => {
  before(() => {
    window.isTestEnv = true;
    document.body.innerHTML = doubleCarousel;
    const carousel1 = document.querySelector('#create-carousel1');
    const carousel2 = document.querySelector('#create-carousel2');
    decorate('', carousel1, { infinityScrollEnabled: false });
    decorate('', carousel2, { infinityScrollEnabled: true });
  });

  it('infinity carousel max scroll position exceeds default carousel scroll position', async () => {
    await clock.nextAsync();

    const platform1 = document.querySelector('.carousel1 .carousel-platform');
    expect(platform1).to.exist;
    const rightFader1 = document.querySelector('.carousel1 .carousel-container .carousel-fader-right');
    expect(rightFader1).to.exist;

    const platform2 = document.querySelector('.carousel2 .carousel-platform');
    expect(platform2).to.exist;
    const rightFader2 = document.querySelector('.carousel2 .carousel-container .carousel-fader-right');
    expect(rightFader2).to.exist;

    let scrollPos1 = platform1.scrollLeft;
    rightFader1.click();
    rightFader2.click();

    let safety = 0;
    while (scrollPos1 !== platform1.scrollLeft && safety < 100) {
      scrollPos1 = platform1.scrollLeft;
      rightFader1.click();
      rightFader2.click();
      safety += 1;
    }
    expect(platform1.scrollLeft).to.be.below(platform2.scrollLeft - 10);
  });
});

describe('Center Aligned Narrow Carousel', () => {
  before(() => {
    window.isTestEnv = true;
    document.body.innerHTML = narrowCarousel;
    const carousel = document.querySelector('#create-carousel');
    decorate('', carousel, { centerAlign: true });
  });
});

describe('Disabled Fader Carousel', () => {
  before(() => {
    window.isTestEnv = true;
    document.body.innerHTML = basicCarousel;
    const carousel = document.querySelector('#create-carousel');
    decorate('', carousel, { fadersDisabled: true });
  });

  it('Faders do not exist', async () => {
    await clock.nextAsync();

    const platform = document.querySelector('.carousel-platform');
    expect(platform).to.exist;
    expect(platform.classList.contains('left-fader')).to.be.false;
    expect(platform.classList.contains('right-fader')).to.be.false;

    const leftFader = document.querySelector('.carousel-container .carousel-fader-left');
    expect(leftFader).to.not.exist;
    const rightFader = document.querySelector('.carousel-container .carousel-fader-right');
    expect(rightFader).to.not.exist;
  });

  it('Triggers do not exist', async () => {
    await clock.nextAsync();

    const leftTrigger = document.querySelector('.carousel-left-trigger');
    expect(leftTrigger).to.not.exist;
    const rightTrigger = document.querySelector('.carousel-right-trigger');
    expect(rightTrigger).to.not.exist;
  });
});
