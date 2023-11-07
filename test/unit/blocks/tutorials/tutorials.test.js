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

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { handlePopstate } from '../../../../express/blocks/tutorials/tutorials.js';

const { default: decorate } = await import(
  '../../../../express/blocks/tutorials/tutorials.js'
);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Tutorials', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Tutorials exists', () => {
    const tutorials = document.querySelector('.tutorials');
    decorate(tutorials);
    expect(tutorials).to.exist;
  });

  it('Tutorials has correct elements', () => {
    expect(document.querySelector('.tutorial-card')).to.exist;
    expect(document.querySelector('.tutorial-card-top')).to.exist;
    expect(document.querySelector('.tutorial-card-overlay')).to.exist;
    expect(document.querySelector('.tutorial-card-play')).to.exist;
    expect(document.querySelector('.tutorial-card-duration')).to.exist;
  });

  it('Display video modal when card is clicked', () => {
    const card = document.querySelector('.tutorial-card');
    card.click();
  });

  it('Display video modal when keyup enter is presses', () => {
    const card = document.querySelector('.tutorial-card');
    const keyupEvent = new KeyboardEvent('keyup', { key: 'Enter' });
    card.dispatchEvent(keyupEvent);

    handlePopstate({ url: 'https://example.com/tutorial' });
  });
});
