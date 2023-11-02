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

import { createTag } from "../../scripts/utils.js";
import isDarkOverlayReadable from "../../scripts/color-tools.js";

function changeTextColorAccordingToBg(primaryColor, block) {
  block.classList.add(isDarkOverlayReadable(primaryColor) ? "light" : "dark");
}

function loadSvgInsideWrapper(svgId, svgWrapper, secondaryColor) {
  const svgNS = "http://www.w3.org/2000/svg";
  const xlinkNS = "http://www.w3.org/1999/xlink";

  // create svg element
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "color-svg-img hidden-svg");

  // create use element
  const useSvg = document.createElementNS(svgNS, "use");
  useSvg.setAttributeNS(
    xlinkNS,
    "xlink:href",
    `/express/icons/color-sprite.svg#${svgId}`
  );

  // append use element to svg element
  svg.appendChild(useSvg);

  // append new svg and remove old one
  svgWrapper.replaceChildren();
  svgWrapper.appendChild(svg);
  svgWrapper.firstElementChild.style.fill = secondaryColor;
}

function displaySvgWithObject(block, secondaryColor) {
  const svg = block.firstElementChild;
  const svgId = svg.firstElementChild.textContent;
  const svgWrapper = createTag("div", { class: "color-svg" });

  svg.remove();
  loadSvgInsideWrapper(svgId, svgWrapper, secondaryColor);
  const svgContainer = block.querySelector(".svg-container");
  svgContainer.append(svgWrapper);
}

function decorateText(block) {
  const text = block.firstElementChild;
  text.classList.add("text-container");
  block.append(text);
}

function extractColorElements(colors) {
  const primaryColor = colors.children[0].textContent.split(",")[0].trim();
  const secondaryColor = colors.children[0].textContent.split(",")[1].trim();
  colors.remove();

  return { primaryColor, secondaryColor };
}

function decorateColors(block) {
  const colors = block.firstElementChild;
  const svgContainer = block.querySelector(".svg-container");
  const { primaryColor, secondaryColor } = extractColorElements(colors);

  if (svgContainer) svgContainer.style.backgroundColor = primaryColor;

  changeTextColorAccordingToBg(primaryColor, block);

  return { secondaryColor };
}

export function getContentContainerHeight() {
  const contentContainer = document.querySelector(".svg-container");

  return contentContainer?.clientHeight;
}

function resizeSvgOnLoad() {
  const interval = setInterval(() => {
    if (document.readyState === "complete") {
      const height = getContentContainerHeight();
      if (height) {
        const svg = document.querySelector(".color-svg-img");
        svg.classList.remove("hidden-svg");
        svg.style.height = `${height}px`;
        clearInterval(interval);
      }
    }
  }, 50);
}

function resizeSvgOnMediaQueryChange() {
  const mediaQuery = window.matchMedia("(min-width: 900px)");
  mediaQuery.addEventListener("change", (event) => resizeSvg(event));
}

export function resizeSvg(event) {
  const height = getContentContainerHeight();
  const svg = document.querySelector(".color-svg-img");
  if (event.matches) {
    svg.style.height = `${height}px`;
  } else {
    svg.style.height = "200px";
  }
}

export default function decorate(block) {
  const svgContainer = createTag("div", { class: "svg-container" });
  block.append(svgContainer);

  // text
  decorateText(block);

  // colors
  const { secondaryColor } = decorateColors(block);

  // svg
  displaySvgWithObject(block, secondaryColor);
  resizeSvgOnLoad();
  resizeSvgOnMediaQueryChange();
}
