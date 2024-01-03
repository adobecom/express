import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import checkMobileBetaEligibility, {
  isIOS16AndUp,
  isOfficiallySupportedDevice,
} from '../../../express/scripts/mobile-beta-gating.js';
import BlockMediator from '../../../express/scripts/block-mediator.min.js';

describe('Mobile Beta Gating', () => {
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
  });

  it('resorts to subsequent tests if cookie does not exist', async () => {
    await checkMobileBetaEligibility();
    expect(BlockMediator.hasStore('mobileBetaEligibility')).to.be.true;
    expect(BlockMediator.get('mobileBetaEligibility')).to.be.undefined;
  });

  it('sets correct value according to cookies', async () => {
    document.cookie = 'device-support=true;path=/';
    await checkMobileBetaEligibility();

    const blockMediatorVal = BlockMediator.get('mobileBetaEligibility');
    expect(blockMediatorVal.deviceSupport).to.be.true;
    expect(blockMediatorVal.data.reason).to.equal('cookie');

    document.cookie = 'device-support=true; expires=1 Jan 1970 00:00:00 GMT;';
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

  it('is able to check whitelist', async () => {
    const MOCK_JSON = {
      total: 20,
      offset: 0,
      limit: 20,
      data: [
        {
          device: 'SM-S908E',
        },
        {
          device: '2201117TI',
        },
        {
          device: 'SM-G781B',
        },
        {
          device: 'M2102J20SI',
        },
        {
          device: 'SM-G980F',
        },
        {
          device: 'SM-G955U',
        },
        {
          device: 'SM-A546E',
        },
        {
          device: 'RMX2001',
        },
        {
          device: 'CPH2401',
        },
        {
          device: 'SM-N980F',
        },
        {
          device: 'M2012K11AI',
        },
        {
          device: 'NE2211',
        },
        {
          device: 'Pixel 2 XL',
        },
        {
          device: 'Samsung M525G',
        },
        {
          device: 'Samsung Galaxy S23 Ultra',
        },
        {
          device: 'Samsung Galaxy A53 5G',
        },
        {
          device: 'Redmi Note 8 Pro',
        },
        {
          device: 'Samsung Galaxy S10',
        },
        {
          device: 'Samsung Galaxy A71',
        },
        {
          device: 'Pixel 6 Pro',
        },
      ],
      ':type': 'sheet',
    };
    const stub = sinon.stub(window, 'fetch');
    stub.returns({ ok: true, json: async () => MOCK_JSON });
    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
      },
    });
    let supported = await isOfficiallySupportedDevice('iOS');
    expect(supported).to.be.true;
    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';
      },
    });
    supported = await isOfficiallySupportedDevice('Android');
    expect(supported).to.be.false;

    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (Linux; Android 13; SM-G955U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';
      },
    });
    supported = await isOfficiallySupportedDevice('Android');
    expect(supported).to.be.true;

    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';
      },
    });
    supported = await isOfficiallySupportedDevice('Android');
    expect(supported).to.be.false;

    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (Linux; Android 13; Pixel 6 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';
      },
    });
    supported = await isOfficiallySupportedDevice('Android');
    expect(supported).to.be.true;

    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';
      },
    });
    supported = await isOfficiallySupportedDevice('Android');
    expect(supported).to.be.true;

    supported = await isOfficiallySupportedDevice('windows');
    expect(supported).to.be.false;
    stub.restore();
  });
});
