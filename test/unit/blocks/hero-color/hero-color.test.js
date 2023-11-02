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

import { readFile, setViewport } from "@web/test-runner-commands";
import { expect } from "@esm-bundle/chai";

const { default: decorate, resizeSvg } = await import(
  "../../../../express/blocks/hero-color/hero-color.js"
);
document.body.innerHTML = await readFile({ path: "./mocks/body.html" });

describe("Hero Color", () => {
  before(() => {
    window.isTestEnv = true;
    const heroColor = document.querySelector(".hero-color");
    decorate(heroColor);
  });

  it("Should have the correct elements", () => {
    expect(document.querySelector(".hero-color")).to.exist;
    expect(document.querySelector(".color-svg")).to.exist;
    expect(document.querySelector("h1")).to.exist;
    expect(document.querySelector("p")).to.exist;
    expect(document.querySelector(".button")).to.exist;
  });

  it("Should have a primary and secondary color", () => {
    const svgContainer = document.querySelector(".svg-container");
    const svgImg = document.querySelector(".color-svg-img");
    const primaryColor = svgContainer.style.backgroundColor;
    const secondaryColor = svgImg.style.fill;

    expect(primaryColor).to.exist;
    expect(secondaryColor).to.exist;
  });

  it("Should resize svg on load", (done) => {
    const svg = document.querySelector(".color-svg-img");
    // setTimeout is needed because the method has a setInterval of 50ms
    setTimeout(() => {
      expect(Array.from(svg.classList)).to.not.contain("hidden-svg");
      expect(svg.style.height).to.equal("154px");
      done();
    }, 50);
  });

  it("Svg height should be changed after screen is resized", () => {
    const svg = document.querySelector(".color-svg-img");
    resizeSvg({ matches: true });
    expect(svg.style.height).to.equal("158px");
    resizeSvg({ matches: false });
    expect(svg.style.height).to.equal("200px");
  });
});
