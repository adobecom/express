/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { handlePopstate } from '../../../../express/blocks/tutorials/tutorials.js';

const { default: decorate } = await import(
  '../../../../express/blocks/tutorials/tutorials.js'
);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Tutorials', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Tutorials exists', () => {
    const tutorials = document.querySelector('.tutorials');
    decorate(tutorials);
    expect(tutorials).to.exist;
  });

  it('Tutorials has correct elements', () => {
    expect(document.querySelector('.tutorial-card')).to.exist;
    expect(document.querySelector('.tutorial-card-top')).to.exist;
    expect(document.querySelector('.tutorial-card-overlay')).to.exist;
    expect(document.querySelector('.tutorial-card-play')).to.exist;
    expect(document.querySelector('.tutorial-card-duration')).to.exist;
  });

  it('Display video modal when card is clicked', () => {
    const card = document.querySelector('.tutorial-card');
    card.click();
  });

  it('Display video modal when keyup enter is presses', () => {
    const card = document.querySelector('.tutorial-card');
    const keyupEvent = new KeyboardEvent('keyup', { key: 'Enter' });
    card.dispatchEvent(keyupEvent);

    const url = {
      url: 'https://example.com/tutorial',
      title: 'Tutorial',
    };
    handlePopstate({ state: url });
  });
});
