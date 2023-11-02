/*
 * Copyright 2021 Adobe. All rights reserved.
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
/* eslint-disable no-unused-vars */

import sinon from 'sinon';
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { decoratePricing } from '../../../../express/scripts/utils/pricing.js';

const { default: decorate } = await import(
  '../../../../express/blocks/list/list.js'
);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('List', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('List exists', () => {
    const list = document.querySelector('.list');
    decorate(list);
    expect(list).to.exist;
  });

  it('Should have the right elements', () => {
    expect(document.querySelector('.item')).to.exist;
    expect(document.querySelector('.item')).to.exist;
    expect(document.querySelector('.item-text')).to.exist;
  });

  // it('should handle async code', async function() {
  //     await decoratePricing();
  //     expect(document.querySelector('a[title^='{{pricing']')).to.exist;
  // });
});
