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

import { readFile, emulateMedia, setViewport, sendMouse } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

document.body.innerHTML = await readFile({ path: './mocks/default.html' });
window.isTestEnv = true;
const { default: decorate, handleMediaQuery } = await import('../../../../express/blocks/marquee/marquee.js');
const darkStaticVersion = await readFile({ path: './mocks/dark-static.html' });
const darkVideoVersion = await readFile({ path: './mocks/dark-video.html' });
const shadowBackgroundVersion = await readFile({ path: './mocks/shadow-background.html' });
const wideVersion = await readFile({ path: './mocks/wide.html' });

function getMiddleOfElement(element) {
  const {
    x,
    y,
    width,
    height,
  } = element.getBoundingClientRect();

  return {
    x: Math.floor(x + window.scrollX + width / 2),
    y: Math.floor(y + window.scrollY + height / 2),
  };
}

describe('marquee', () => {
  describe('default version', () => {
    it('has a video background', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      const video = marquee.querySelector('video.marquee-background');
      expect(video).to.exist;
    });

    it('has a content foreground', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      const content = marquee.querySelector('.marquee-foreground .content-wrapper');
      expect(content).to.exist;
    });

    it('has at least an H1', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      const h1 = marquee.querySelector('.marquee-foreground .content-wrapper h1');
      expect(h1).to.exist;
    });

    it('has reduce motion toggle', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      const video = marquee.querySelector('video.marquee-background');
      video.dispatchEvent(new Event('canplay'));
      const reduceMotionToggle = marquee.querySelector('.reduce-motion-wrapper');
      expect(reduceMotionToggle).to.exist;
    });

    it('reduce motion toggle can control hero animation', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      const video = marquee.querySelector('video.marquee-background');
      video.dispatchEvent(new Event('canplay'));
      const reduceMotionToggle = marquee.querySelector('.reduce-motion-wrapper');
      reduceMotionToggle.click();
      expect(marquee.classList.contains('reduce-motion')).to.be.true;

      reduceMotionToggle.click();
      expect(marquee.classList.contains('reduce-motion')).to.be.false;
    });

    it('reduce motion toggle responds to mouse hover', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      const video = marquee.querySelector('video.marquee-background');
      video.dispatchEvent(new Event('canplay'));
      const reduceMotionToggle = marquee.querySelector('.reduce-motion-wrapper');
      const { x, y } = getMiddleOfElement(reduceMotionToggle);
      await sendMouse({ type: 'move', position: [x, y] });

      expect(reduceMotionToggle.children.length).equals(4);
    });

    it('system accessibility setting affects the page live', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      const mediaQuery = matchMedia('(prefers-reduced-motion: reduce)');
      handleMediaQuery(marquee, mediaQuery);
      await emulateMedia({ reducedMotion: 'no-preference' });
      mediaQuery.dispatchEvent(new Event('change'));
      expect(mediaQuery.matches).to.be.false;
      await emulateMedia({ reducedMotion: 'reduce' });
      mediaQuery.dispatchEvent(new Event('change'));
      expect(mediaQuery.matches).to.be.true;
    });

    it('window resize triggers video adjustment', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      const video = marquee.querySelector('video.marquee-background');
      video.src = 'foo';
      await setViewport({ width: 360, height: 640 });
      const newVideo = marquee.querySelector('video.marquee-background');

      expect(newVideo.src).to.not.equal('foo');
    });
  });

  describe('dark version with video', () => {
    beforeEach(() => {
      document.body.innerHTML = darkVideoVersion;
    });

    it('is dark', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      expect(marquee.classList.contains('dark')).to.be.true;
    });

    it('uses different set of SVG for reduce-motion toggle', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      const video = marquee.querySelector('video.marquee-background');
      video.dispatchEvent(new Event('canplay'));
      const lightPlayIcon = marquee.querySelector('.icon-play-video-light');
      expect(lightPlayIcon).to.exist;
    });
  });

  describe('supports static asset', () => {
    beforeEach(() => {
      document.body.innerHTML = darkStaticVersion;
    });

    it('renders an image background', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      const video = marquee.querySelector('.background-wrapper video');
      expect(video.poster !== '' && !video.querySelector('source')).to.be.true;
    });

    it('does not load reduce motion toggle', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      const reduceMotionToggle = marquee.querySelector('.reduce-motion-wrapper');
      expect(reduceMotionToggle).to.not.exist;
    });
  });

  describe('supports options', () => {
    beforeEach(() => {
      document.body.innerHTML = shadowBackgroundVersion;
    });

    it('renders an background color', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      expect(marquee.getAttribute('style')).to.not.equal('');
    });

    it('renders a shadow', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      const shadow = marquee.querySelector('.hero-shadow');
      expect(shadow).to.exist;
    });

    it('video link opens video overlay', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      const { x, y } = getMiddleOfElement(marquee.querySelector('a.button.accent.secondary'));
      await sendMouse({ type: 'click', position: [x, y] });

      expect(document.querySelector('.video-overlay')).to.exist;
    });
  });

  describe('supports wide variant', () => {
    beforeEach(() => {
      document.body.innerHTML = wideVersion;
    });

    it('renders an wide background', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
    });
  });
});
