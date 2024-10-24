/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../../express/blocks/table-of-contents/table-of-contents.js');

describe('table-of-contents', () => {
  before(() => {
    window.isTestEnv = true;
  });

  beforeEach(async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const block = document.querySelector('.table-of-contents');
    block.classList.add('table-of-contents');
  });

  it('generates toc-entry elements for h2 headings', () => {
    const block = document.querySelector('.table-of-contents');
    const config = { levels: '2' };
    block.dataset.config = JSON.stringify(config);

    decorate(block, 'table-of-contents', document);

    const tocEntries = document.querySelectorAll('.toc-entry');
    tocEntries.forEach((entry) => {
      const levelClass = entry.classList[1];
      expect(levelClass).to.equal('toc-level-h2');
    });
  });
});
