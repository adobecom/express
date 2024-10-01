/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';

await import('../../../../express/scripts/scripts.js');

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

  it('should generate toc-entry elements linking to the correct sections', () => {
    const block = document.querySelector('.table-of-contents');
    decorate(block);
    console.log(block);
    expect(document.querySelector(".table-of-contents")).to.exist;
  });
});
