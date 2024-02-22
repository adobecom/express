/* eslint-env mocha */
/* eslint-disable no-unused-vars */
import { readFile, sendMouse } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { setConfig } from '../../../../express/scripts/utils.js';

const { default: decorate } = await import('../../../../express/blocks/floating-panel/floating-panel.js');
const testBody = await readFile({ path: './mocks/body.html' });

const locales = {
  '': { ietf: 'en-US', tk: 'hah7vzn.css' },
  br: { ietf: 'pt-BR', tk: 'inq1xob.css' },
  cn: { ietf: 'zh-Hans-CN', tk: 'puu3xkp' },
  de: { ietf: 'de-DE', tk: 'vin7zsi.css' },
  dk: { ietf: 'da-DK', tk: 'aaz7dvd.css' },
  es: { ietf: 'es-ES', tk: 'oln4yqj.css' },
  fi: { ietf: 'fi-FI', tk: 'aaz7dvd.css' },
  fr: { ietf: 'fr-FR', tk: 'vrk5vyv.css' },
  gb: { ietf: 'en-GB', tk: 'pps7abe.css' },
  in: { ietf: 'en-GB', tk: 'pps7abe.css' },
  it: { ietf: 'it-IT', tk: 'bbf5pok.css' },
  jp: { ietf: 'ja-JP', tk: 'dvg6awq' },
  kr: { ietf: 'ko-KR', tk: 'qjs5sfm' },
  nl: { ietf: 'nl-NL', tk: 'cya6bri.css' },
  no: { ietf: 'no-NO', tk: 'aaz7dvd.css' },
  se: { ietf: 'sv-SE', tk: 'fpk1pcd.css' },
  tw: { ietf: 'zh-Hant-TW', tk: 'jay0ecd' },
  uk: { ietf: 'en-GB', tk: 'pps7abe.css' },
};

setConfig({ locales });

function getMiddleOfElement(element) {
  const {
    x,
    y,
    width,
    height,
  } = element.getBoundingClientRect();
  return {
    x: Math.floor(x + window.scrollX + width / 2),
    y: Math.floor(y + window.scrollY + height / 2),
  };
}

describe('Floating Panel', () => {
  beforeEach(() => {
    window.isTestEnv = true;
    window.placeholders = {};
    document.body.innerHTML = testBody;
  });

  it('loading the static state correctly', async () => {
    const block = document.querySelector('.floating-panel');
    await decorate(block);
    expect(block).to.exist;
  });

  it('block reacts to hovering', async () => {
    const block = document.querySelector('.floating-panel');
    await decorate(block);
    const { x, y } = getMiddleOfElement(block);
    await sendMouse({ type: 'move', position: [x, y] });
    const timeline = block.querySelector('.timeline');
    expect(timeline.children.length).to.equal(3);
  });

  it('there are ways to close the box', async () => {
    const block = document.querySelector('.floating-panel');
    await decorate(block);
    const { x, y } = getMiddleOfElement(block);
    await sendMouse({ type: 'move', position: [x, y] });
    await sendMouse({ type: 'move', position: [x - 1000, y] });
    expect(block.classList.contains('expanded')).to.be.false;

    await sendMouse({ type: 'move', position: [x, y] });
    const closeButton = block.querySelector('.close-panel-button');
    closeButton.click();
    expect(block.classList.contains('expanded')).to.be.false;
  });
});
