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

import {
  createTag,
} from '../../scripts/scripts.js';

function isDarkOverlayReadable(colorString) {
  let r;
  let g;
  let b;

  if (colorString.match(/^rgb/)) {
    const colorValues = colorString.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/,
    );
    [r, g, b] = colorValues.slice(1);
  } else {
    const hexToRgb = +`0x${colorString
      .slice(1)
      .replace(colorString.length < 5 ? /./g : '', '$&$&')}`;
    // eslint-disable-next-line no-bitwise
    r = (hexToRgb >> 16) & 255;
    // eslint-disable-next-line no-bitwise
    g = (hexToRgb >> 8) & 255;
    // eslint-disable-next-line no-bitwise
    b = hexToRgb & 255;
  }

  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  return hsp > 140;
}

function cloneForSmallerMediaQueries(textBlock) {
  const clonedTextBlock = textBlock.cloneNode(true);

  clonedTextBlock.classList.add('text-container');
  clonedTextBlock.children[0].classList.add('text');

  return clonedTextBlock;
}

function changeTextColorAccordingToBg(
  primaryColor,
  heroColorContentContainer,
) {
  heroColorContentContainer.classList.add(isDarkOverlayReadable(primaryColor) ? 'light-bg' : 'dark-bg');
}

function loadSvgInsideWrapper(mediaQuery, svgId, svgWrapper, secondaryColor) {
  const size = mediaQuery.matches ? 'desktop' : 'mobile';
  const svgNS = 'http://www.w3.org/2000/svg';
  const xlinkNS = 'http://www.w3.org/1999/xlink';

  // create svg element
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'color-svg-img');

  // create use element
  const useSvg = document.createElementNS(svgNS, 'use');
  useSvg.setAttributeNS(xlinkNS, 'xlink:href', `/express/icons/color-sprite.svg#${svgId}-${size}`);

  // append use element to svg element
  svg.appendChild(useSvg);

  // append new svg and remove old one
  svgWrapper.replaceChildren();
  svgWrapper.appendChild(svg);
  svgWrapper.firstElementChild.style.fill = secondaryColor;
}

function changeSvgAccordingToMediaQuery(svgId, svgWrapper, secondaryColor) {
  const mediaQuery = window.matchMedia('(min-width: 900px)');
  loadSvgInsideWrapper(mediaQuery, svgId, svgWrapper, secondaryColor);
  mediaQuery.addEventListener('change', (event) => {
    loadSvgInsideWrapper(event, svgId, svgWrapper, secondaryColor);
  });
}

function displaySvgWithObject(block, secondaryColor) {
  const svg = block.firstElementChild;
  const svgId = svg.firstElementChild.textContent;
  const svgWrapper = createTag('div', { class: 'color-svg' });

  svg.remove();
  changeSvgAccordingToMediaQuery(svgId, svgWrapper, secondaryColor);
  const heroColorContentContainer = block.querySelector('.content-container');
  heroColorContentContainer.append(svgWrapper);
}

function groupTextElements(text, block) {
  const title = block.querySelector('h2');
  const description = block.querySelector('p');
  const cta = block.querySelector('.button-container');
  const button = cta.querySelector('.button');

  button.style.border = 'none';
  text.classList.add('text');
  text.append(title, description, cta);
}

function extractColorElements(colors) {
  const primaryColor = colors.children[0].textContent.split(',')[0].trim();
  const secondaryColor = colors.children[0].textContent.split(',')[1].trim();
  colors.remove();

  return { primaryColor, secondaryColor };
}

function decorateColors(block) {
  const colors = block.firstElementChild;
  const { primaryColor, secondaryColor } = extractColorElements(colors);
  const heroColorContentContainer = block.querySelector('.content-container');
  heroColorContentContainer.style.backgroundColor = primaryColor;
  changeTextColorAccordingToBg(primaryColor, heroColorContentContainer);

  return { secondaryColor };
}

function decorateText(block) {
  const text = block.firstElementChild;
  const smallMediaQueryBlock = cloneForSmallerMediaQueries(text);
  const heroColorContentContainer = block.querySelector('.content-container');

  groupTextElements(text, block);
  heroColorContentContainer.append(text);
  block.append(smallMediaQueryBlock);
}

export default function decorate(block) {
  const heroColorContentContainer = createTag('div', {
    class: 'content-container',
  });
  block.append(heroColorContentContainer);

  // text
  decorateText(block);

  // colors
  const { secondaryColor } = decorateColors(block);

  // svg
  displaySvgWithObject(block, secondaryColor);
}
