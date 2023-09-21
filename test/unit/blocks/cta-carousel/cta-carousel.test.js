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
const body = await readFile({ path: './mocks/body.html' });

describe('CTA Carousel - Create Variant', () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = body;
  });

  it('has a heading', async () => {
    const createVariant = document.getElementById('create-variant');
    await decorate(createVariant);
    const heading = createVariant.querySelector('.cta-carousel-heading-section h2, h3, h4, h5 ,h6');
    expect(heading).to.exist;
  });

  it('has subtext in the heading', async () => {
    const createVariant = document.getElementById('create-variant');
    await decorate(createVariant);
    const subtext = createVariant.querySelector('.cta-carousel-heading-section p');
    expect(subtext).to.exist;
  });

  it('supports up to 2 CTAs', async () => {
    const createVariant = document.getElementById('create-variant');
    await decorate(createVariant);
    const cards = createVariant.querySelectorAll('.card');
    let ctaCounts = 0;
    cards.forEach((card) => {
      const ctas = card.querySelectorAll('a');
      ctaCounts = Math.max(ctas.length, ctaCounts);
    });
    expect(ctaCounts).to.be.greaterThan(1);
  });

  it('character mapping helper works', async () => {
    const createVariant = document.getElementById('create-variant');
    await decorate(createVariant);
    const input = '&<>"\'`=/';
    const output = '&amp;&lt;&gt;&quot;&#39;&#x2F;&#x60;&#x3D;';
    expect(sanitizeInput(input) === output).to.be.true;
  });
});

describe('CTA Carousel - Quick Action Variant', () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = body;
  });

  it('supports up to 2 CTAs', async () => {
    const qaVariant = document.getElementById('qa-variant');
    await decorate(qaVariant);
    const cards = qaVariant.querySelectorAll('.card');
    let ctaCounts = 0;
    cards.forEach((card) => {
      const ctas = card.querySelectorAll('a');
      ctaCounts = Math.max(ctas.length, ctaCounts);
    });
    expect(ctaCounts).to.be.lessThan(2);
  });
});

describe('CTA Carousel - Gen AI variant', async () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = body;
  });



  it('supports prompt form', async () => {
    const gaVariant = document.getElementById('ga-variant');
    await decorate(gaVariant);
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
    const gaVariant = document.getElementById('ga-variant');
    await decorate(gaVariant);
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

describe('CTA Carousel - Quick Action + Gen AI combo', async () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = body;
  });

  it('first card has gen AI input', async () => {
    const qgVariant = document.getElementById('qa-ga-variant');
    await decorate(qgVariant);
    const card = qgVariant.querySelector('.card');
    const formFound = card.querySelector('form.gen-ai-input-form');
    const textAreaFound = card.querySelector('textarea.gen-ai-input');
    const buttonFound = card.querySelector('button.gen-ai-submit');
    const genAIElementsExist = formFound && textAreaFound && buttonFound;

    expect(genAIElementsExist).to.be.true;
  });
});

describe('Gen AI + Upload Combo', async () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = body;
  });

  it('first card has gen AI upload link', async () => {
    const guVariant = document.getElementById('ga-upload-variant');
    await decorate(guVariant).then(() => {
      console.log(guVariant.innerHTML);
    });

    const card = guVariant.querySelector('.card');
    const uploadLink = card.querySelector('a.gen-ai-upload');

    expect(uploadLink).to.be.true;
  });
});
