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
import { decorateAutoBlock } from '../../../../express/scripts/utils.js';

const { default: decorate } = await import(
  '../../../../express/blocks/columns/columns.js'
);

const body = await readFile({ path: './mocks/body.html' });
const center = await readFile({ path: './mocks/center.html' });
const centered = await readFile({ path: './mocks/centered.html' });
const dark = await readFile({ path: './mocks/dark.html' });
const light = await readFile({ path: './mocks/light.html' });
const fullsizeCenter = await readFile({ path: './mocks/fullsize-center.html' });
const fullsize = await readFile({ path: './mocks/fullsize.html' });
const topCenter = await readFile({ path: './mocks/top-center.html' });
const highlight = await readFile({ path: './mocks/highlight.html' });
const numbered30 = await readFile({ path: './mocks/numbered-30.html' });

describe('Columns', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Columns exists', () => {
    document.body.innerHTML = body;
    const columns = document.querySelector('.columns');
    decorate(columns);
    expect(columns).to.exist;
  });

  it('elementsMinHeight should be 0', () => {
    document.body.innerHTML = fullsize;
    const columns = document.querySelector('.columns.fullsize');
    decorate(columns);
    const h3s = columns.querySelectorAll('h3');
    h3s.forEach((h3) => {
      expect(h3.style.minHeight).to.not.equal('0');
    });
  });

  it('should process the color block', () => {
    document.body.innerHTML = body;
    const block = document.querySelector('.columns');
    decorate(block);

    const svgCol = block.querySelector('.color-svg-img');
    expect(svgCol).to.exist;
    expect(svgCol.parentElement.style.backgroundColor).to.equal('Red');
    expect(svgCol.parentElement.style.fill).to.equal('Blue');

    const svgUseHref = svgCol.querySelector('use').getAttribute('href');
    expect(svgUseHref).to.equal('/express/icons/color-sprite.svg#mySvgId');
  });
});
