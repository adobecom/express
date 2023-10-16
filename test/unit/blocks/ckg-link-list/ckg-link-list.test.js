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

const { default: decorate } = await import('../../../../express/blocks/ckg-link-list/ckg-link-list.js');
const html = await readFile({ path: './mocks/default.html' });

describe('CKG Link List', () => {
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = html;
  });

  it('Block loads ckg pills with correct pathname as context', async () => {
    const block = document.querySelector('.ckg-link-list');
    await decorate(block);
    const links = block.querySelectorAll('a');

    expect(links.length).to.be.greaterThan(0);
  });
});
