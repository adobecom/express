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

const { default: decorate } = await import('../../../../express/blocks/toggle-bar/toggle-bar.js');

const defVer = await readFile({ path: './mocks/default.html' });
const stickyVer = await readFile({ path: './mocks/sticky.html' });
const floatVer = await readFile({ path: './mocks/float-sticky.html' });

describe('Toggle Bar - Default Variant', () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = defVer;
  });

  it('block exists', async () => {
    const block = document.getElementById('default-version');
    await decorate(block);
    expect(block).to.exist;
  });

  it('toggling works', async () => {
    const block = document.getElementById('default-version');
    await decorate(block);

    const buttons = block.querySelectorAll('button.toggle-bar-button');
    buttons[1].click();

    expect(document.querySelector('.section[data-toggle="Social media"]').style.display).to.equal('block');
  });
});

describe('Toggle Bar - Sticky Variant', () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = stickyVer;
  });

  it('sticky variant block exists', async () => {
    const block = document.getElementById('sticky-version');
    await decorate(block);
    expect(block).to.exist;
  });

  it('becomes sticky when scrolled', async () => {
    const block = document.getElementById('sticky-version');
    await decorate(block);
    window.scrollBy({
      top: window.innerHeight,
    });
    document.dispatchEvent(new Event('scroll'));
    expect(block.classList.contains('sticking')).to.be.true;
  });

  it('hides when scrolled past activated section', async () => {
    const block = document.getElementById('sticky-version');
    await decorate(block);
    window.scrollTo({
      top: document.body.scrollHeight,
    });
    document.dispatchEvent(new Event('scroll'));
    expect(block.classList.contains('hidden')).to.be.true;
  });

  it('responses to GNav', async () => {
    const block = document.getElementById('sticky-version');
    const header = document.querySelector('header');
    await decorate(block);
    window.dispatchEvent(new CustomEvent('feds.events.experience.loaded'));
    expect(block.classList.contains('bumped-by-gnav')).to.be.false;

    block.classList.remove('hidden');
    block.classList.add('sticking');
    header.classList.remove('feds-header-wrapper--retracted');
    header.classList.add('feds-header-wrapper--scrolled');

    setTimeout(() => {
      expect(block.classList.contains('bumped-by-gnav')).to.be.true;
    });
  });
});

describe('Toggle Bar - Float Sticky variant', async () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = floatVer;
  });

  it('floating sticky variant block exists', async () => {
    const block = document.getElementById('float-sticky-version');
    await decorate(block);
    expect(block).to.exist;
  });
});
