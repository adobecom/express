import BlockMediator from './block-mediator.min.js';
import { getMobileOperatingSystem, getMetadata } from './utils.js';

const ANDROID_WL_DEVICES_PATH = '/express/benchmark-android-wl.json?limit=100000';
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

export async function isOfficiallySupportedDevice(os) {
  const { userAgent } = navigator;
  if (os === 'iOS') {
    return isIOS16AndUp(userAgent);
  }

  if (os === 'Android') {
    const resp = await fetch(ANDROID_WL_DEVICES_PATH);
    if (!resp.ok) {
      window.lana?.log('Failed to fetch Android whitelist devices');
      return false;
    }
    const json = await resp.json();
    return json?.data?.some(({ device }) => new RegExp(device).test(userAgent));
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

      if (getMobileOperatingSystem() === 'Android') {
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
  // allow disabling gating via metadata, regardless of eligibility
  if (['off', 'false', 'no'].includes(getMetadata('mobile-gating'))) {
    BlockMediator.set('mobileBetaEligibility', {
      deviceSupport: false,
      data: {
        reason: 'gating-off',
      },
    });
    return;
  }
  const deviceSupportCookie = document.cookie.split('; ').find((row) => row.startsWith('device-support='))?.split('=')[1];

  if (deviceSupportCookie === 'true') {
    BlockMediator.set('mobileBetaEligibility', {
      deviceSupport: true,
      data: {
        reason: 'cookie',
      },
    });
  } else {
    const isOfficiallySupported = await isOfficiallySupportedDevice(getMobileOperatingSystem());
    if (isOfficiallySupported) {
      BlockMediator.set('mobileBetaEligibility', {
        deviceSupport: true,
        data: {
          reason: 'whitelisted',
        },
      });
      return;
    }
    runBenchmark();
    const unsubscribe = BlockMediator.subscribe('mobileBetaEligibility', async (e) => {
      const expireDate = new Date();
      const month = (expireDate.getMonth() + 1) % 12;
      expireDate.setMonth(month);
      if (month === 0) expireDate.setFullYear(expireDate.getFullYear() + 1);
      document.cookie = `device-support=${e.newValue.deviceSupport};domain=adobe.com;expires=${expireDate.toUTCString()};path=/`;
      unsubscribe();
    });
  }
}
