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

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
const { default: decorate } = await import('../../../express/blocks/feature-grid-desktop/feature-grid-desktop.js');
// What does the default do?

// Describe method takes two args: description and a function to do testing
describe('Feature Grid Desktop', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('check if Feature Grid block exists', () => {
    const featureGrid = document.querySelector('.feature-grid-desktop');
    decorate(featureGrid);
    expect(featureGrid).to.exist;
  });
});
