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

const { default: decorate, sanitizeInput, decorateTextWithTag } = await import('../../../../express/blocks/cta-carousel/cta-carousel.js');

const create = await readFile({ path: './mocks/create.html' });
const quickAction = await readFile({ path: './mocks/quick-action.html' });
const genAI = await readFile({ path: './mocks/gen-ai.html' });
const genAiQuickAction = await readFile({ path: './mocks/gen-ai-quick-action.html' });
const genAiUpload = await readFile({ path: './mocks/gen-ai-upload.html' });

describe('CTA Carousel - Create Variant', () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = create;
    window.placeholders = {
      'search-branch-links': 'https://adobesparkpost.app.link/c4bWARQhWAb',
    };
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

  it('support video media', async () => {
    const createVariant = document.getElementById('create-variant');
    await decorate(createVariant);
    const videoMedia = createVariant.querySelector('.media-wrapper video');

    expect(videoMedia).to.exist;
  });

  it('linkless card will have coming soon class', async () => {
    const createVariant = document.getElementById('create-variant');
    await decorate(createVariant);
    const cards = createVariant.querySelectorAll('.card');
    const linkLessCard = Array.from(cards).find((card) => !card.querySelector('.links-wrapper > a'));

    expect(linkLessCard).to.exist;
    expect(linkLessCard.classList.contains('coming-soon')).to.be.true;
  });

  it('character mapping helper works', async () => {
    const createVariant = document.getElementById('create-variant');
    await decorate(createVariant);
    const input = '&<>"\'/`=';
    const output = '&amp;&lt;&gt;&quot;&#39;&#x2F;&#x60;&#x3D;';
    expect(sanitizeInput(input) === output).to.be.true;
  });

  it('tag generate helper works', async () => {
    const pTag = decorateTextWithTag('Text to image (Beta) [AI]');
    const spanTag = pTag.querySelector('span.tag');
    expect(spanTag).to.exist;
  });
});

describe('CTA Carousel - Quick Action Variant', () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = quickAction;
  });

  it('supports only one CTA', async () => {
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
    document.body.innerHTML = genAI;
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

    expect(formFound).to.exist;
    expect(textAreaFound).to.exist;
    expect(buttonFound).to.exist;
  });

  it('form input responds to keyup events', async () => {
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

    await sendKeys({
      press: 'Enter',
    });

    expect(button.disabled).to.be.true;
  });

  it('form responds to submit event', async () => {
    const gaVariant = document.getElementById('ga-variant');
    await decorate(gaVariant);
    const form = gaVariant.querySelector('form.gen-ai-input-form');
    const input = form.querySelector('textarea.gen-ai-input');
    const button = form.querySelector('button.gen-ai-submit');

    input.focus();
    await sendKeys({
      press: 'A',
    });
    form.dispatchEvent(new Event('submit'));

    expect(button.disabled).to.be.true;
  });
});

describe('CTA Carousel - Quick Action + Gen AI combo', async () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = genAiQuickAction;
  });

  it('first card has gen AI input', async () => {
    const qgVariant = document.getElementById('qa-ga-variant');
    await decorate(qgVariant);
    const card = qgVariant.querySelector('.card');
    const formFound = card.querySelector('form.gen-ai-input-form');
    const textAreaFound = card.querySelector('textarea.gen-ai-input');
    const buttonFound = card.querySelector('button.gen-ai-submit');

    expect(formFound).to.exist;
    expect(textAreaFound).to.exist;
    expect(buttonFound).to.exist;
  });
});

describe('Gen AI + Upload Combo', async () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = genAiUpload;
  });

  it('first card has gen AI upload link', async () => {
    const guVariant = document.getElementById('ga-upload-variant');
    await decorate(guVariant);

    const card = guVariant.querySelector('.card');
    const uploadLink = card.querySelector('.gen-ai-upload');

    expect(uploadLink).to.exist;
  });
});
