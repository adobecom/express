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
});

// describe('selectPlan', () => {
//   beforeEach(async () => {
//     window.isTestEnv = true;
//     document.body.innerHTML = await readFile({ path: './mocks/body.html' });
//   });

//   const puf = document.querySelector('.puf');
//   decorate(puf);

//   const plan = fetchPlan(planUrl);

//   it('should call pushPricingAnalytics if sendAnalyticEvent is true', async () => {
//     let calledWithArgs = null;
//     const dependencies = {
//       fetchPlan: async () => plan,
//       buildUrl: () => 'url',
//       pushPricingAnalytics: () => {
//         calledWithArgs = arguments;
//       }
//     };
  
//     await selectPlan(card, planUrl, true, dependencies);
  
//     expect(calledWithArgs).to.not.be.null;
//     expect(calledWithArgs[0]).to.equal('adobe.com:express:pricing:commitmentType:selected');
//     expect(calledWithArgs[1]).to.equal('pricing:commitmentTypeSelected');
//     expect(calledWithArgs[2]).to.deep.equal(plan);
//   });
