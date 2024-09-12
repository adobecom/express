import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

import init from '../../../express/blocks/region-nav/region-nav.js';
import { setConfig } from '../../../express/scripts/utils.js';

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
document.body.innerHTML = await readFile({ path: './mocks/regions.html' });

describe('Region Nav Block', () => {
  it('sets links correctly', async () => {
    const block = document.body.querySelector('.region-nav');
    init(block);
    const links = document.body.querySelectorAll('a');
    const path = window.location.href.replace(origin, '');
    expect(links[0].href).to.be.equal(`${origin}/es${path}`);
    expect(links[links.length - 1].href).to.be.equal(`${origin}/kr${path}`);
    window.location.hash = '';
  });
});
