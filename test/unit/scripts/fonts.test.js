/* eslint-disable no-unused-expressions */
/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import { loadStyle } from '../../../express/scripts/utils.js';

describe('Fonts', () => {
  it('Loads CSS fonts', async () => {
    const { default: loadFonts } = await import('../../../express/scripts/fonts.js');
    const fontResp = await loadFonts({ ietf: 'en-US', tk: 'jdq5hay.css' }, loadStyle);
    expect(fontResp).to.exist;
  });

  it('Loads JS fonts', async () => {
    const { default: loadFonts } = await import('../../../express/scripts/fonts.js');
    const fontResp = await loadFonts({ ietf: 'ja-JP', tk: 'dvg6awq' }, loadStyle);
    expect(fontResp.classList.contains('wf-loading')).to.be.true;
  });
});
