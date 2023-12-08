import { expect } from '@esm-bundle/chai';
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
    expect(isIOS16AndUp('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1')).to.be.true;
    expect(isIOS16AndUp('Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36')).to.be.false;
  });

  it('is able to check whitelist', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
      },
    });
    expect(isOfficiallySupportedDevice('iOS')).to.be.true;
    Object.defineProperty(navigator, 'userAgent', {
      get() {
        return 'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';
      },
    });
    expect(isOfficiallySupportedDevice('android')).to.be.false;
    expect(isOfficiallySupportedDevice('windows')).to.be.false;
  });
});
