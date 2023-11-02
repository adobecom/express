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

const { default: decorate } = await import('../../../../express/blocks/icon-list/icon-list.js');

describe('Icon List', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Icon List exists', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const iconList = document.querySelector('.icon-list');
    decorate(iconList);
    expect(iconList).to.exist;
  });

  it('4 columns should be transformed to 2', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/4-column-body.html' });
    const iconList = document.querySelector('.icon-list');
    decorate(iconList);
    const columns = document.querySelectorAll('.icon-list-column');
    expect(columns.length).to.equal(2);
  });

  it('2 columns should have icon-list-image and icon-list-description classes', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const iconList = document.querySelector('.icon-list');
    decorate(iconList);
    const columns = document.querySelectorAll('.icon-list-column');

    columns.forEach((column) => {
      const hasImageClass = column.classList.contains('icon-list-image');
      const hasDescriptionClass = column.classList.contains('icon-list-description');

      expect(hasImageClass).to.be.true;
      expect(hasDescriptionClass).to.be.true;
    });
  });

  it('Text content in .icon-list-image should be icon if no img or svg', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const iconList = document.querySelector('.icon-list');
    decorate(iconList);
    const columns = document.querySelectorAll('.icon-list-column');

    columns.forEach((column) => {
      const imageDiv = column.querySelector('.icon-list-image');
      const originalTextContent = imageDiv.textContent.trim();

      if (!imageDiv.querySelector('img, svg')) {
        expect(imageDiv.innerHTML).to.not.equal(originalTextContent);
      }
    });
  });
});
