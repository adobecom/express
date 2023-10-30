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
const color = await readFile({ path: './mocks/color.html' });
const center = await readFile({ path: './mocks/center.html' });
const centered = await readFile({ path: './mocks/centered.html' });
const dark = await readFile({ path: './mocks/dark.html' });
const light = await readFile({ path: './mocks/light.html' });
const fullsizeCenter = await readFile({ path: './mocks/fullsize-center.html' });
const fullsize = await readFile({ path: './mocks/fullsize.html' });
const offer = await readFile({ path: './mocks/offer.html' });
const offerIcon = await readFile({ path: './mocks/offer-icon.html' });
const icon = await readFile({ path: './mocks/icon.html' });
const iconWithSibling = await readFile({ path: './mocks/icon-with-sibling.html' });
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

  it('should render a numbered column', () => {
    document.body.innerHTML = numbered30;
    const block = document.querySelector('.columns');
    decorate(block);

    const columnNumber = block.querySelector('.num');
    expect(columnNumber.textContent).to.be.equal('01/30 —');
  });

  it('should render an offer column & have only 1 row', () => {
    document.body.innerHTML = offer;
    const block = document.querySelector('.columns');
    decorate(block);

    const rows = Array.from(block.children);
    expect(rows.length).to.be.equal(1);
  });

  it('Should transform primary color to bg color and secondary color to fill', () => {
    document.body.innerHTML = color;
    const block = document.querySelector('.columns');
    decorate(block);

    const imgWrapper = block.querySelector('.img-wrapper');
    expect(imgWrapper.style.backgroundColor).to.be.equal('rgb(255, 87, 51)');
    expect(imgWrapper.style.fill).to.be.equal('rgb(52, 210, 228)');
  });

  it('should render an offer column and decorate icons', () => {
    document.body.innerHTML = offerIcon;
    const block = document.querySelector('.columns');
    decorate(block);
  });

  it('should render a column and decorate icons', () => {
    document.body.innerHTML = icon;
    const block = document.querySelector('.columns');
    decorate(block);
  });

  it('should render a column and decorate icons with sibling', () => {
    document.body.innerHTML = iconWithSibling;
    const block = document.querySelector('.columns');
    decorate(block);
  });
});
