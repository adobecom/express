import BlockMediator from './block-mediator.min.js';
import { getMobileOperatingSystem } from './utils.js';

// todo: need to determine the final source of this whitelist
const ELIGIBLE_ANDROID_DEVICES = [];
const MAX_EXEC_TIME_ALLOWED = 450;
const TOTAL_PRIME_NUMBER = 10000;

export function isIOS16AndUp(userAgent = navigator.userAgent) {
  if (/iPhone/i.test(userAgent)) {
    const iOSVersionMatch = userAgent.match(/OS (\d+)_/);
    if (iOSVersionMatch && iOSVersionMatch.length > 1) {
      return parseInt(iOSVersionMatch[1], 10) >= 16;
    } else {
      window.lana?.log('iOS userAgent regex match failed');
    }
  }

  return false;
}

export function isOfficiallySupportedDevice(os) {
  const { userAgent } = navigator;
  if (os === 'iOS') {
    return isIOS16AndUp(userAgent);
  }

  if (os === 'android') {
    const regex = /Android.+; ([^;]+)\) AppleWebKit\//;

    const match = regex.exec(userAgent);
    if (match && match.length > 1) {
      return ELIGIBLE_ANDROID_DEVICES.includes(match[1]);
    } else {
      window.lana?.log('Android device name regex match failed');
    }
  }

  return false;
}

function runBenchmark() {
  if (window.Worker) {
    const benchmarkWorker = new Worker('/express/scripts/gating-benchmark.js');
    benchmarkWorker.postMessage(TOTAL_PRIME_NUMBER);
    benchmarkWorker.onmessage = (e) => {
      const criterion = {
        cpuSpeedPass: e.data <= MAX_EXEC_TIME_ALLOWED,
      };

      if (getMobileOperatingSystem() === 'android') {
        criterion.cpuCoreCountPass = (navigator.hardwareConcurrency
          && navigator.hardwareConcurrency >= 4)
        || false;
        criterion.memoryCapacityPass = (navigator.deviceMemory
          && navigator.deviceMemory >= 4)
        || false;
      }

      if (getMobileOperatingSystem() === 'iOS') {
        criterion.iOSVersionPass = isIOS16AndUp(navigator.userAgent);
      }

      const deviceEligible = Object.values(criterion).every((criteria) => criteria);

      BlockMediator.set('mobileBetaEligibility', {
        deviceSupport: !!deviceEligible,
        data: criterion,
      });

      benchmarkWorker.terminate();
    };
  }
}

export default async function checkMobileBetaEligibility() {
  const deviceSupportCookie = document.cookie.split('; ').find((row) => row.startsWith('device-support='))?.split('=')[1];

  if (deviceSupportCookie === 'true') {
    BlockMediator.set('mobileBetaEligibility', {
      deviceSupport: true,
      data: {
        reason: 'cookie',
      },
    });
  } else if (isOfficiallySupportedDevice(getMobileOperatingSystem())) {
    BlockMediator.set('mobileBetaEligibility', {
      deviceSupport: true,
      data: {
        reason: 'whitelisted',
      },
    });
  } else {
    runBenchmark();
    const unsubscribe = BlockMediator.subscribe('mobileBetaEligibility', async (e) => {
      const expireDate = new Date();
      const month = (expireDate.getMonth() + 1) % 12;
      expireDate.setMonth(month);
      document.cookie = `device-support=${e.newValue.deviceSupport};domain=$adobe.com;expires=${expireDate.toUTCString()};path=/`;
      unsubscribe();
    });
  }
}
