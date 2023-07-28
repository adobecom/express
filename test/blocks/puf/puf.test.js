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
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('PUF', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('PUF exists', () => {
    const puf = document.querySelector('.puf');
    decorate(puf);
    expect(puf).to.exist;
  });

  it('PUF has a footer', () => {
    const blockWith4Children = createTag('div', { class: 'block' });
    for (let i = 0; i < 4; i += 1) {
      blockWith4Children.append(createTag('div', { class: `block_content{i + 1}` }));
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
    const checkbox = document.querySelector('.puf input[type="checkbox"]');
    checkbox.click();
    expect(checkbox.checked).to.be.true;
    checkbox.click();
    expect(checkbox.checked).to.be.false;
  });

  it('CTA contains the right text', () => {
    const cardTop = document.createElement('div');
    const cardCta = document.createElement('div');
    const ctaTextContainer = cardTop.querySelector('strong');

    if (ctaTextContainer) {
      cardCta.textContent = ctaTextContainer.textContent.trim();
      ctaTextContainer.parentNode.remove();
    } else {
      cardCta.textContent = 'Start your trial';
    }

    
  });
});
