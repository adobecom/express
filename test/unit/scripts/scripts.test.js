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
import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';
import { removeIrrelevantSections, createTag } from '../../../express/scripts/scripts.js';

describe('Scripts', () => {
  it('removes sections from main component if section metadata showwith set to validcode0 and not active in metadata', async () => {
    // prepare
    document.body.innerHTML = await readFile({ path: './mocks/showwith-sections.html' });
    const meta = createTag('meta', { name: 'validcode0', content: 'doesnotmatter' });
    document.head.append(meta);
    const main = document.querySelector('main');
    removeIrrelevantSections(main);
    const remainingSections = main.querySelectorAll(':scope > div');

    // assert
    expect(remainingSections.length).to.be.equal(2);

    // cleanup
    meta.remove();
  });

  it('removes sections from main component if section metadata showwith set to validcode0 and not present in metadata', async () => {
    // prepare
    document.body.innerHTML = await readFile({ path: './mocks/showwith-sections.html' });
    const main = document.querySelector('main');
    removeIrrelevantSections(main);
    const remainingSections = main.querySelectorAll(':scope > div');

    // assert
    expect(remainingSections.length).to.be.equal(2);
  });

  it('leaves sections in main component if section metadata showwith set to validcode0 but active in metadata', async () => {
    // prepare
    document.body.innerHTML = await readFile({ path: './mocks/showwith-sections.html' });
    const meta = createTag('meta', { name: 'validcode0', content: 'on' });
    document.head.append(meta);
    const main = document.querySelector('main');
    removeIrrelevantSections(main);
    const remainingSections = main.querySelectorAll(':scope > div');

    // assert
    expect(remainingSections.length).to.be.equal(4);

    // cleanup
    meta.remove();
  });
});
