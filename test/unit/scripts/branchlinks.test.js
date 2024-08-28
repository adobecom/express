import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { setConfig, createTag } from '../../../express/scripts/utils.js';

const { default: trackBranchParameters, getTrackingAppendedURL } = await import(
  '../../../express/scripts/branchlinks.js'
);

document.body.innerHTML = await readFile({ path: './mocks/branchlinks.html' });
setConfig({});

function setMeta(name, content) {
  document.head.append(createTag('meta', { name, content }));
}

describe('branchlinks getTrackingAppendedURL', () => {
  let urls;
  before(() => {
    window.isTestEnv = true;
    window.placeholders = {
      'search-branch-links':
        'https://adobesparkpost.app.link/c4bWARQhWAb, https://adobesparkpost.app.link/lQEQ4Pi1YHb, https://adobesparkpost.app.link/9tmWXXDAhLb',
    };
    window.hlx = { experiment: null };
    setMeta('branch-asset-collection', 'test');
    setMeta('branch-newstuff', 'test');
  });
  beforeEach(() => {
    urls = [...document.querySelectorAll('a')].map((a) => a.href);
  });
  after(() => {
    document.querySelector('meta[name="branch-asset-collection"]').remove();
    document.querySelector('meta[name="branch-newstuff"]').remove();
  });
  it('returns a string', () => {
    urls.forEach((url) => expect(getTrackingAppendedURL(url, window.placeholders)).to.be.string);
  });
  it('adds to branch links locale', () => {
    const appendedUrls = urls.map((url) => getTrackingAppendedURL(url, window.placeholders));
    appendedUrls.forEach((url) => expect(url.includes('locale')).to.be.true);
  });
  it('appends branch tracking parameters to search branch links only', () => {
    const appendedUrls = urls.map((url) => getTrackingAppendedURL(url, window.placeholders));
    expect(appendedUrls[0].includes('assetCollection')).to.be.false;
    expect(appendedUrls[1].includes('assetCollection')).to.be.true;
    expect(appendedUrls[1].includes('newstuff')).to.be.true;
    expect(appendedUrls[2].includes('assetCollection')).to.be.false;
  });
  it('accepts searchOverride option to allow non search branch links to work like search branch links', () => {
    expect(
      getTrackingAppendedURL(urls[2], window.placeholders, { isSearchOverride: true }).includes(
        'assetCollection',
      ),
    ).to.be.true;
  });
});

describe('branchlinks trackBranchParameteres', () => {
  let links;
  before(async () => {
    window.isTestEnv = true;
    window.placeholders = {
      'search-branch-links':
        'https://adobesparkpost.app.link/c4bWARQhWAb, https://adobesparkpost.app.link/lQEQ4Pi1YHb, https://adobesparkpost.app.link/9tmWXXDAhLb',
    };
    window.hlx = { experiment: null };
    links = [
      ...document.querySelectorAll('a'),
      createTag(
        'a',
        {
          href: 'https://adobesparkpost.app.link/GJrBPFUWBBb?acomx-dno=y',
        },
        'normal branch link with no tracking wanted',
      ),
    ];
    await trackBranchParameters(links);
  });
  it('adds rel=nofollow to branch links', () => {
    links.forEach((link) => {
      expect(link.rel === 'nofollow').to.be.true;
    });
  });
  // <a href="https://adobesparkpost.app.link/GJrBPFUWBBb?acomx-dno=y">normal branch link with no tracking wanted</a>
  it('skips adding params for links with disable flag', () => {
    links.forEach((link, index) => {
      if (index === links.length - 1) {
        expect(link.href.includes('locale')).to.be.false;
      } else {
        expect(link.href.includes('locale')).to.be.true;
      }
    });
  });
});
