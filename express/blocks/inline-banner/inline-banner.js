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
  normalizeHeadings,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

export default function decorate($block) {
  normalizeHeadings($block, ['h2', 'h3', 'h4']);
  const $section = $block.closest('main .section');
  if ($section
    && ($section.className.includes('dark') || $section.className.includes('highlight'))) {
    // force inverted style
    $block.classList.add('inverted');
    $block.querySelectorAll('a.button').forEach(($btn) => {
      // buttons must be primary + light
      $btn.className = 'button primary light';
    });
  }
}
