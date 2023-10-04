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
import HtmlSanitizer from '../../../express/scripts/html-sanitizer.js';

describe('HTML Sanitizer', () => {
  it('Allows safe HTML', () => {
    const input = '<p>This is a <strong>safe</strong> message.</p>';
    const output = HtmlSanitizer.SanitizeHtml(input);

    expect(output).to.equal(input);
  });

  it('Prevent attribute Injection', () => {
    const input = '<a href="javascript:alert(\'XSS Attack\')">Click me</a>';
    const output = HtmlSanitizer.SanitizeHtml(input);

    expect(output).to.equal('<a>Click me</a>');
  });

  it('Nests tags correctly', () => {
    const input = '<p>This is <strong><em>safe</em></strong> text.</p>';
    const output = HtmlSanitizer.SanitizeHtml(input);

    expect(output).to.equal(input);
  });

  it('Guards against mixed case tags', () => {
    const input = '<IMG SRC="javascript:alert(\'XSS Attack\');">';
    const output = HtmlSanitizer.SanitizeHtml(input);

    expect(output).to.equal('<img>');
  });

  it('Guards against event handler injection', () => {
    const input = '<img src="image.jpg" onload="alert(\'XSS Attack\')">';
    const output = HtmlSanitizer.SanitizeHtml(input);

    expect(output).to.equal('<img src="image.jpg">');
  });

  it('Allows some style injection', () => {
    const input = '<p style="display: none; background-image: url(wrong-image.jpg)">hidden text</p>';
    const output = HtmlSanitizer.SanitizeHtml(input);

    expect(output).to.equal('<p style="display: none;">hidden text</p>');
  });

  it('Allows some content types but converts to div', () => {
    const input = '<form>A form trying to do bad things</form>';
    const output = HtmlSanitizer.SanitizeHtml(input);

    expect(output).to.equal('<div>A form trying to do bad things</div>');
  });
});
