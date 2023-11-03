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

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

import init from '../../../express/blocks/region-nav/region-nav.js';

document.body.innerHTML = await readFile({ path: './mocks/regions.html' });

describe('Region Nav Block', () => {
  it('sets links correctly', async () => {
    const block = document.body.querySelector('.region-nav');
    init(block);
    const links = document.body.querySelectorAll('a');
    const path = window.location.href.replace(origin, '');
    expect(links[0].href).to.be.equal(`${origin}/ar${path}`);
    expect(links[links.length - 1].href).to.be.equal(`${origin}/kr${path}`);
    window.location.hash = '';
  });
});
