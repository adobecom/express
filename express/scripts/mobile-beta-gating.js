import BlockMediator from './block-mediator.min.js';
import { getMobileOperatingSystem } from './utils.js';

function setSessionCookie(name, value, domain) {
  let cookie = '';

  cookie = `${name}=${value};`;

  if (domain) {
    cookie += `domain=${domain};`;
  }

  cookie += 'path=/';

  document.cookie = cookie;
}

function getCookie(name) {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i += 1) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

function isIOS16AndUp() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  if (/iPhone/i.test(userAgent)) {
    const iOSVersionMatch = userAgent.match(/OS (\d+)_/);
    if (iOSVersionMatch && iOSVersionMatch.length > 1) {
      const iOSVersion = parseInt(iOSVersionMatch[1], 10);

      return iOSVersion >= 16;
    }
  }

  return false;
}

function runBenchmark() {
  if (window.Worker) {
    const benchmarkWorker = new Worker('/express/scripts/gating-benchmark.js');
    benchmarkWorker.postMessage(10000000);
    benchmarkWorker.onmessage = (e) => {
      const criterion = {
        cpuSpeedPass: e.data <= 400,
      };

      // old android approach
      // if (getMobileOperatingSystem() !== 'iOS') {
      //   criterion.cpuCoreCountPass = (navigator.hardwareConcurrency
      //     && navigator.hardwareConcurrency >= 4)
      //   || false;
      //   criterion.memoryCapacityPass = (navigator.deviceMemory
      //     && navigator.deviceMemory >= 4)
      //   || false;
      // }

      if (getMobileOperatingSystem() === 'iOS') {
        criterion.iOSVersionPass = isIOS16AndUp();
      }

      const deviceEligible = Object.values(criterion).every((criteria) => criteria);

      BlockMediator.set('mobileBetaEligibility', {
        deviceSupport: deviceEligible ? 'true' : 'false',
        data: criterion,
      });

      benchmarkWorker.terminate();
    };
  }
}

export default async function checkMobileBetaEligibility() {
  const deviceSupportCookie = getCookie('device-support');

  if (deviceSupportCookie) {
    BlockMediator.set('mobileBetaEligibility', {
      deviceSupport: deviceSupportCookie,
      data: {
        reason: 'pre-checked',
      },
    });
  } else {
    runBenchmark();
    const unsubscribe = BlockMediator.subscribe('mobileBetaEligibility', async (e) => {
      if (['true', 'false'].includes(e.newValue.deviceSupport)) {
        setSessionCookie('device-support', e.newValue.deviceSupport, '.adobe.com');
        unsubscribe();
      }
    });
  }
}
