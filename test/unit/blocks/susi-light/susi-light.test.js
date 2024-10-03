/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { setConfig } from '../../../../express/scripts/utils.js';

document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Susi-light', async () => {
  setConfig({});
  let blocks;
  before(async () => {
    window.isTestEnv = true;
    blocks = [...document.querySelectorAll('.susi-light')];
    const { default: decorate } = await import(
      '../../../../express/blocks/susi-light/susi-light.js'
    );
    await Promise.all(blocks.map((bl) => decorate(bl)));
  });

  it('Susi-light gets decorated with required properties', () => {
    const component = document.querySelector('susi-sentry-light');
    expect(component).to.exist;
    expect(!!component.variant).to.be.true;
    expect(!!component.config).to.be.true;
    expect(!!component.authParams).to.be.true;
  });

  it('Susi-light gets decorated', () => {
    const component = document.querySelector('susi-sentry-light');
    expect(component).to.exist;
    expect(!!component.shadowRoot).to.be.true;
  });

  it('SUSI-light gets wrapped with easy-in variant', () => {
    const component = document.querySelector('.easy-in-wrapper');
    expect(component).to.exist;
    const logo = component.querySelector('.express-logo');
    const title = component.querySelector('.title');
    const guest = component.querySelector('.guest');
    const guestA = guest?.querySelector('a');
    [logo, title, guest, guestA].forEach((e) => expect(e).to.exist);
  });
});
