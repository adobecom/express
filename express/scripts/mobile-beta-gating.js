import BlockMediator from './block-mediator.min.js';
import { getMobileOperatingSystem, loadArea } from './utils.js';

const MAX_EXEC_TIME_ALLOWED = 500;
const TOTAL_PRIME_NUMBER = 10000;

function setMetadata(name, content, attribute = 'name') {
  // Special case for the document title
  if (name.toLowerCase() === 'title') {
    document.title = content;
    return;
  }

  // Handling <link> elements separately (e.g., favicon)
  if (name.toLowerCase() === 'favicon') {
    const linkElement = document.querySelector('link[rel="icon"]') || document.createElement('link');
    linkElement.rel = 'icon';
    linkElement.href = content;
    document.head.appendChild(linkElement);
    return;
  }

  // Check if the meta tag already exists
  const existingMeta = document.querySelector(`meta[${attribute}="${name}"]`);
  if (existingMeta) {
    existingMeta.content = content;
  } else {
    // If it does not exist, create a new meta tag
    const metaElement = document.createElement('meta');
    metaElement.setAttribute(attribute, name);
    metaElement.content = content;
    document.head.appendChild(metaElement);
  }
}

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

function isChrome() {
  const { userAgent } = navigator;
  // from horizon
  return /Chrome|CriOS/.test(userAgent) && !/Edg|OPR|Opera|OPiOS|Vivaldi|YaBrowser|Avast|VivoBrowser|GSA/.test(userAgent);
}

export async function fetchAndroidAllowDenyLists() {
  const resp = await fetch('/express/android-device-list.json?limit=100000');
  if (!resp.ok) {
    window.lana?.log('Failed to fetch Android whitelist devices');
    return {};
  }
  const { 'allow-list': allowList, 'deny-list': denyList } = await resp.json();
  return { allowList, denyList };
}

export async function preBenchmarkCheck() {
  const deviceSupportCookie = document.cookie.split('; ').find((row) => row.startsWith('device-support='))?.split('=')[1];
  if (deviceSupportCookie === 'true') {
    return [true, 'cookie'];
  }

  const os = getMobileOperatingSystem();
  if (os === 'iOS') {
    const ok = isIOS16AndUp();
    return [ok, `iOS ${ok ? 'white' : 'deny'}listed`];
  } else if (os !== 'Android') {
    return [false, 'not iOS or Android'];
  }
  if (!isChrome()) return [false, 'Android not Chrome'];
  const { allowList, denyList } = await fetchAndroidAllowDenyLists();
  const { userAgent, hardwareConcurrency, deviceMemory } = navigator;
  if (allowList.data.some(({ device }) => new RegExp(`Android .+; ${device}`).test(userAgent))) {
    return [true, 'Android whitelisted'];
  }
  if (denyList.data.some(({ device }) => new RegExp(`Android .+; ${device}`).test(userAgent))) {
    return [false, 'Android denylisted'];
  }
  if (!hardwareConcurrency || hardwareConcurrency < 4) {
    return [false, 'Android cpu core count'];
  }
  if (!deviceMemory || deviceMemory < 4) {
    return [false, 'Android memory capacity'];
  }
  if (!window.Worker) {
    return [false, 'Android no worker'];
  }
  return [null, 'needs benchmark'];
}

function initWebWorker() {
  const unsubscribe = BlockMediator.subscribe('mobileBetaEligibility', async (e) => {
    const expireDate = new Date();
    const month = (expireDate.getMonth() + 1) % 12;
    expireDate.setMonth(month);
    if (month === 0) expireDate.setFullYear(expireDate.getFullYear() + 1);
    document.cookie = `device-support=${e.newValue.deviceSupport};domain=adobe.com;expires=${expireDate.toUTCString()};path=/`;
    unsubscribe();
  });
  const benchmarkWorker = new Worker('/express/scripts/gating-benchmark.js');
  benchmarkWorker.postMessage(TOTAL_PRIME_NUMBER);
  return benchmarkWorker;
}

export default async function checkMobileBetaEligibility() {
  const [eligible, reason] = await preBenchmarkCheck();
  if (reason === 'needs benchmark') {
    const benchmarkWorker = initWebWorker();
    benchmarkWorker.onmessage = async (e) => {
      const isEligible = e.data <= MAX_EXEC_TIME_ALLOWED;
      BlockMediator.set('mobileBetaEligibility', {
        deviceSupport: isEligible,
        data: 'Android cpuSpeedPass',
      });
      benchmarkWorker.terminate();
    };
  } else {
    BlockMediator.set('mobileBetaEligibility', {
      deviceSupport: eligible,
      data: {
        reason,
      },
    });
  }
}

export async function rushCheckMobileBetaEligibility() {
  const [eligible, reason] = await preBenchmarkCheck();
  if (reason === 'needs benchmark') {
    const benchmarkWorker = initWebWorker();
    benchmarkWorker.onmessage = async (e) => {
      const isEligible = e.data <= MAX_EXEC_TIME_ALLOWED;
      BlockMediator.set('mobileBetaEligibility', {
        deviceSupport: isEligible,
        data: 'Android cpuSpeedPass',
      });

      if (!isEligible) {
        setMetadata('betaineligibledevice', 'on');
      }
      await loadArea();
      benchmarkWorker.terminate();
    };
  } else {
    if (!eligible) {
      setMetadata('betaineligibledevice', 'on');
    }
    BlockMediator.set('mobileBetaEligibility', {
      deviceSupport: eligible,
      data: {
        reason,
      },
    });
    await loadArea();
  }
}
