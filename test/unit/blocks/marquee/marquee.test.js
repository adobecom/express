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

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

document.body.innerHTML = await readFile({ path: './mocks/default.html' });
window.isTestEnv = true;
const { default: decorate } = await import('../../../../express/blocks/marquee/marquee.js');
const staticVersion = await readFile({ path: './mocks/dark-static.html' });
const videoVersion = await readFile({ path: './mocks/dark-video.html' });
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
      video.addEventListener('canplay', () => {
        const reduceMotionToggle = marquee.querySelector('.reduce-motion-wrapper');
        expect(reduceMotionToggle).to.exist;
      });
    });
  });

  describe('dark version', () => {
    before(() => {
      document.body.innerHTML = videoVersion;
    });

    it('is dark', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      expect(marquee.classList.contains('dark')).to.be.true;
    });
  });

  describe('supports static asset', () => {
    before(() => {
      document.body.innerHTML = staticVersion;
    });

    it('renders an image background', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);

      const video = marquee.querySelector('.background video');
      expect(video.poster !== '' && !video.querySelector('source')).to.be.true;
    });

    it('does not load reduce motion toggle', async () => {
      const marquee = document.querySelector('.marquee');
      await decorate(marquee);
      const reduceMotionToggle = marquee.querySelector('.reduce-motion-wrapper');
      expect(reduceMotionToggle).to.not.exist;
    });
  });
});
