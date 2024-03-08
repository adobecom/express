import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';
import { removeIrrelevantSections, createTag } from '../../../express/utils/utils.js';

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
