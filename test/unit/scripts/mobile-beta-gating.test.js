import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import checkMobileBetaEligibility, {
  isIOS16AndUp,
  fetchAndroidAllowDenyLists,
  preBenchmarkCheck,
} from '../../../express/scripts/mobile-beta-gating.js';
import BlockMediator from '../../../express/scripts/block-mediator.min.js';

describe('Mobile Beta Gating', () => {
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
  });

  let stub;
  before(() => {
    const MOCK_JSON = {
      'allow-list': {
        total: 25,
        offset: 0,
        limit: 25,
        data: [
          { device: 'SM-S908E' },
          { device: '2201117TI' },
          { device: 'SM-G781B' },
          { device: 'M2102J20SI' },
          { device: 'SM-G980F' },
          { device: 'SM-G955U' },
          { device: 'SM-A546E' },
          { device: 'RMX2001' },
          { device: 'CPH2401' },
          { device: 'SM-N980F' },
          { device: 'M2012K11AI' },
          { device: 'NE2211' },
          { device: 'Pixel 2 XL' },
          { device: 'Samsung M525G' },
          { device: 'Samsung Galaxy S23 Ultra' },
          { device: 'Samsung Galaxy A53 5G' },
          { device: 'Redmi Note 8 Pro' },
          { device: 'Samsung Galaxy S10' },
          { device: 'Samsung Galaxy A71' },
          { device: 'Pixel \\d Pro' },
          { device: 'Pixel 4' },
          { device: 'Pixel 5' },
          { device: 'Pixel 6' },
          { device: 'Pixel 7' },
          { device: 'Pixel 8' },
        ],
      },
      'deny-list': {
        total: 1,
        offset: 0,
        limit: 1,
        data: [{ device: 'Samsung Galaxy A12' }],
      },
      ':version': 3,
      ':names': ['allow-list', 'deny-list'],
      ':type': 'multi-sheet',
    };
    stub = sinon.stub(window, 'fetch');
    stub.returns({ ok: true, json: async () => MOCK_JSON });
  });
  after(() => {
    stub.restore();
  });
  beforeEach(() => {
    document.cookie = 'device-support=;path=/;expires=0';
  });

  it('resorts to subsequent tests if cookie does not exist', async () => {
    await checkMobileBetaEligibility();
    expect(BlockMediator.hasStore('mobileBetaEligibility')).to.be.true;
  });

  it('sets correct value according to cookies', async () => {
    document.cookie = 'device-support=true;path=/';
    await checkMobileBetaEligibility();

    const blockMediatorVal = BlockMediator.get('mobileBetaEligibility');
    expect(blockMediatorVal.deviceSupport).to.be.true;
    expect(blockMediatorVal.data.reason).to.equal('cookie');
  });

  it('is able to check iOS versions', async () => {
    expect(
      isIOS16AndUp(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      ),
    ).to.be.true;
    expect(
      isIOS16AndUp(
        'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
      ),
    ).to.be.false;
  });

  it('can fetchAllowDenyLists', async () => {
    const { allowList, denyList } = await fetchAndroidAllowDenyLists();
    expect(allowList).to.exist;
    expect(denyList).to.exist;
  });

  it('runs preBenchmarkCheck', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
      },
    });
    let [eligible, reason] = await preBenchmarkCheck();
    expect(eligible).to.be.true;
    expect(reason).to.equal('iOS whitelisted');

    // suppressing isChrome check for beta release
    // Object.defineProperty(navigator, 'userAgent', {
    //   get() {
    // eslint-disable-next-line max-len
    //     return 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Opera/92.0.4515.131 Mobile Safari/537.36';
    //   },
    // });
    // [eligible, reason] = await preBenchmarkCheck();
    // // only testing for false negative. False positive can be unavoidable
    // expect(eligible).to.be.false;
    // expect(reason).to.equal('Android not Chrome');

    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_2 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D257 Safari/9537.53';
      },
    });
    [eligible, reason] = await preBenchmarkCheck();
    expect(eligible).to.be.false;
    expect(reason).to.equal('iOS denylisted');

    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';
      },
    });
    [eligible, reason] = await preBenchmarkCheck();
    expect(eligible === null).to.be.true;
    expect(reason).to.equal('needs benchmark');

    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (Linux; Android 13; SM-G955U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';
      },
    });
    [eligible, reason] = await preBenchmarkCheck();
    expect(eligible).to.be.true;
    expect(reason).to.equal('Android whitelisted');

    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';
      },
    });
    [eligible, reason] = await preBenchmarkCheck();
    expect(eligible).to.be.true;
    expect(reason).to.equal('Android whitelisted');

    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (Linux; Android 13; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';
      },
    });
    [eligible, reason] = await preBenchmarkCheck();
    expect(eligible === null).to.be.true;
    expect(reason).to.equal('needs benchmark');

    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (Linux; Android 13; Pixel 3 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';
      },
    });
    [eligible, reason] = await preBenchmarkCheck();
    expect(eligible).to.be.true;
    expect(reason).to.equal('Android whitelisted');

    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';
      },
    });
    [eligible, reason] = await preBenchmarkCheck();
    expect(eligible).to.be.true;
    expect(reason).to.equal('Android whitelisted');
    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (Linux; Android 8.0.0; Samsung Galaxy A12 Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';
      },
    });
    [eligible, reason] = await preBenchmarkCheck();
    expect(eligible).to.be.false;
    expect(reason).to.equal('Android denylisted');

    // windows phone should fail
    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1; Microsoft; Lumia 950) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Mobile Safari/537.36 Edge/14.14263';
      },
    });
    [eligible, reason] = await preBenchmarkCheck();
    expect(eligible).to.be.false;
    expect(reason).to.equal('not iOS or Android');
  });
});
