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

import { readFile, sendKeys } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate, sanitizeInput } = await import('../../../../express/blocks/cta-carousel/cta-carousel.js');
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('CTA Carousel', async () => {
  before(() => {
    window.isTestEnv = true;
  });

  describe('Create Variant', async () => {
    const createVariant = document.getElementById('create-variant');
    await decorate(createVariant);

    it('has a heading', () => {
      const heading = createVariant.querySelector('.cta-carousel-heading-section h2, h3, h4, h5 ,h6');
      expect(heading).to.exist;
    });

    it('has subtext in the heading', () => {
      const subtext = createVariant.querySelector('.cta-carousel-heading-section p');
      expect(subtext).to.exist;
    });

    it('supports up to 2 CTAs', () => {
      const cards = createVariant.querySelectorAll('.card');
      let ctaCounts = 0;
      cards.forEach((card) => {
        const ctas = card.querySelectorAll('a');
        ctaCounts = Math.max(ctas.length, ctaCounts);
      });
      expect(ctaCounts).to.be.greaterThan(1);
    });

    it('character mapping helper works', () => {
      const input = '&<>"\'`=/';
      const output = '&amp;&lt;&gt;&quot;&#39;&#x2F;&#x60;&#x3D;';
      expect(sanitizeInput(input) === output).to.be.true;
    });
  });

  describe('Quick Action Variant', async () => {
    const qaVariant = document.getElementById('qa-variant');
    await decorate(qaVariant);

    it('supports up to 2 CTAs', () => {
      const cards = qaVariant.querySelectorAll('.card');
      let ctaCounts = 0;
      cards.forEach((card) => {
        const ctas = card.querySelectorAll('a');
        ctaCounts = Math.max(ctas.length, ctaCounts);
      });
      expect(ctaCounts).to.be.lessThan(2);
    });
  });

  describe('Gen AI variant', async () => {
    const gaVariant = document.getElementById('ga-variant');
    await decorate(gaVariant);

    it('supports prompt form', () => {
      const cards = gaVariant.querySelectorAll('.card');
      let formFound;
      let textAreaFound;
      let buttonFound;

      cards.forEach((card) => {
        formFound = formFound || card.querySelector('form.gen-ai-input-form');
        textAreaFound = textAreaFound || card.querySelector('textarea.gen-ai-input');
        buttonFound = buttonFound || card.querySelector('button.gen-ai-submit');
      });

      const genAIElementsExist = formFound && textAreaFound && buttonFound;

      expect(genAIElementsExist).to.be.true;
    });

    it('form responds keyup events', async () => {
      const form = gaVariant.querySelector('form.gen-ai-input-form');
      const input = form.querySelector('textarea.gen-ai-input');
      const button = form.querySelector('button.gen-ai-submit');

      input.focus();
      await sendKeys({
        press: 'A',
      });

      expect(button.disabled).to.be.false;
    });
  });

  describe('Quick Action + Gen AI combo', async () => {
    const qgVariant = document.getElementById('qa-ga-variant');
    await decorate(qgVariant);

    it('first card has gen AI input', () => {
      const card = qgVariant.querySelector('.card');
      const formFound = card.querySelector('form.gen-ai-input-form');
      const textAreaFound = card.querySelector('textarea.gen-ai-input');
      const buttonFound = card.querySelector('button.gen-ai-submit');
      const genAIElementsExist = formFound && textAreaFound && buttonFound;

      expect(genAIElementsExist).to.be.true;
    });
  });

  describe('Gen AI + Upload Combo', async () => {
    const guVariant = document.getElementById('ga-upload-variant');
    await decorate(guVariant);

    it('first card has gen AI upload link', () => {
      const card = guVariant.querySelector('.card');
      const uploadLink = card.querySelector('a.gen-ai-upload');

      expect(uploadLink).to.be.true;
    });
  });
});
