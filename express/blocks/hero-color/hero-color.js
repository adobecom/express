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

import { createTag } from "../../scripts/scripts.js";

function isDarkOverlayReadable(colorString) {
  let r;
  let g;
  let b;

  if (colorString.match(/^rgb/)) {
    const colorValues = colorString.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
    );
    [r, g, b] = colorValues.slice(1);
  } else {
    const hexToRgb = +`0x${colorString
      .slice(1)
      .replace(colorString.length < 5 ? /./g : "", "$&$&")}`;
    // eslint-disable-next-line no-bitwise
    r = (hexToRgb >> 16) & 255;
    // eslint-disable-next-line no-bitwise
    g = (hexToRgb >> 8) & 255;
    // eslint-disable-next-line no-bitwise
    b = hexToRgb & 255;
  }

  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  if (hsp > 140) {
    return true;
  } else {
    return false;
  }
}

function cloneForSmallerMediaQueries(textBlock) {
  const clonedTextBlock = textBlock.cloneNode(true);

  clonedTextBlock.classList.add("text-container");
  clonedTextBlock.children[0].classList.add("text");

  return clonedTextBlock;
}

function changeColorAccordingToBg(
  primaryColor,
  heroColorContentContainer,
  button
) {
  const isLightBg = isDarkOverlayReadable(primaryColor);
  if (isLightBg) {
    heroColorContentContainer.style.color = "#000000";
    button.style.backgroundColor = "#000000";
    button.style.color = "#ffffff";
  } else {
    heroColorContentContainer.style.color = "#ffffff";
    button.style.backgroundColor = "#ffffff";
    button.style.color = "#000000";
  }
}

export default function decorate(block) {
  const [text, colors, svg] = Array.from(block.children);

  const smallMediaQueryBlock = cloneForSmallerMediaQueries(text);

  const heroColorContentContainer = createTag("div", {
    class: "content-container",
  });

  //colors
  const primaryColor = colors.children[0].textContent.split(",")[0].trim();
  const secondaryColor = colors.children[0].textContent.split(",")[1].trim();
  colors.remove();

  heroColorContentContainer.style.backgroundColor = primaryColor;

  //text
  const title = block.querySelector("h2");
  const description = block.querySelector("p");
  const cta = block.querySelector(".button-container");
  const button = cta.querySelector(".button");
  button.style.border = "none";
  text.classList.add("text");
  text.append(title, description, cta);

  //dynamic colors
  changeColorAccordingToBg(primaryColor, heroColorContentContainer, button);

  heroColorContentContainer.append(text);
  displaySvgWithObject(svg, heroColorContentContainer, secondaryColor);
  block.append(heroColorContentContainer);
  block.append(smallMediaQueryBlock);
}

function displaySvgWithObject(svg, heroColorContentContainer, secondaryColor) {
  const svgId = svg.children[0].textContent;
  svg.remove();

  const svgWrapper = createTag("div", { class: "color-svg" });
  svgWrapper.classList.add("fade-in");

  //media
  changeSvgAccordingToMediaQuery(svgId, svgWrapper);
  window.addEventListener("resize", () =>
    changeSvgAccordingToMediaQuery(svgId, svgWrapper)
  );

  svgWrapper.firstElementChild.style.fill = secondaryColor;
  heroColorContentContainer.append(svgWrapper);
}

function changeSvgAccordingToMediaQuery(svgId, svgWrapper) {
  const size = window.matchMedia("(min-width: 900px)").matches
    ? "desktop"
    : "mobile";
  svgWrapper.innerHTML = `<svg class="color-svg-img">
    <use href="/express/icons/hero-color.svg#${svgId}-${size}"></use>
  </svg>`;
}
