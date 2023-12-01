import { BlockMediator } from './block-mediator.min.js';
import { getMobileOperatingSystem } from './utils.js';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

export default async function checkMobileBetaEligibility() {
  if (window.Worker) {
    const benchmarkWorker = new Worker('/express/scripts/gating-benchmark.js');
    benchmarkWorker.postMessage(10000000);
    benchmarkWorker.onmessage = (e) => {
      const criterion = {
        cpuSpeedPass: e.data <= 400,
        cpuCoreCountPass: (navigator.hardwareConcurrency
          && navigator.hardwareConcurrency >= 4)
        || false,
      };
  
      if (getMobileOperatingSystem() !== 'iOS') {
        criterion.memoryCapacityPass = (navigator.deviceMemory
          && navigator.deviceMemory >= 4)
        || false;
      }
  
      const deviceEligible = Object.values(criterion).every((criteria) => criteria);
  
      BlockMediator.set('mobileBetaEligibility', {
        result: deviceEligible ? 'passed' : 'rejected',
        data: criterion,
      });
  
      benchmarkWorker.terminate();
    };
  }
}
