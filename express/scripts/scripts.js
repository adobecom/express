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

import {
  sampleRUM,
  getDevice,
  removeIrrelevantSections,
  loadArea,
  stamp,
  registerPerformanceLogger,
} from './utils.js';

window.RUM_GENERATION = 'ccx-gen-4-experiment-high-sample-rate';
window.RUM_LOW_SAMPLE_RATE = 100;
window.RUM_HIGH_SAMPLE_RATE = 50;

window.dataLayer = window.dataLayer || [];

sampleRUM('top');

window.addEventListener('load', () => sampleRUM('load'));
document.addEventListener('click', () => sampleRUM('click'));

const usp = new URLSearchParams(window.location.search);
window.spark = {};
window.spark.hostname = usp.get('hostname') || window.location.hostname;

const eagerLoad = (img) => {
  img?.setAttribute('loading', 'eager');
  img?.setAttribute('fetchpriority', 'high');
};

(async function loadLCPImage() {
  const body = document.querySelector('body');
  body.dataset.device = getDevice();
  const main = body.querySelector('main');
  removeIrrelevantSections(main);
  const firstDiv = main.querySelector('div:nth-child(1) > div');
  if (firstDiv?.classList.contains('marquee')) {
    firstDiv.querySelectorAll('img').forEach(eagerLoad);
  } else {
    eagerLoad(document.querySelector('img'));
  }
}());

(async function loadPage() {
  if (!window.hlx.init && !window.isTestEnv) {
    await loadArea();
  }
}());

stamp('start');

if (window.name.includes('performance')) registerPerformanceLogger();
