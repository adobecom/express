import {
  loadScript,
  checkTesting,
} from './utils.js';

const usp = new URLSearchParams(window.location.search);
const martech = usp.get('martech');
// alloy feature flag
let martechURL;
if (
  (window.spark && window.spark.hostname === 'www.stage.adobe.com')
  || martech === 'alloy-qa'
) {
  martechURL = 'https://www.adobe.com/marketingtech/main.standard.qa.js';
} else {
  martechURL = 'https://www.adobe.com/marketingtech/main.standard.min.js';
}

window.marketingtech = {
  adobe: {
    launch: {
      url: (
        (
          (window.spark && window.spark.hostname === 'www.stage.adobe.com')
          || martech === 'alloy-qa'
        )
          ? 'https://assets.adobedtm.com/d4d114c60e50/a0e989131fd5/launch-2c94beadc94f-development.js'
          : 'https://assets.adobedtm.com/d4d114c60e50/a0e989131fd5/launch-5dd5dd2177e6.min.js'
      ),
    },
    alloy: {
      edgeConfigId: (
        (
          (window.spark && window.spark.hostname === 'www.stage.adobe.com')
          || martech === 'alloy-qa'
        )
          ? '8d2805dd-85bf-4748-82eb-f99fdad117a6'
          : '2cba807b-7430-41ae-9aac-db2b0da742d5'
      ),
    },
    target: checkTesting(),
    audienceManager: true,
  },
};
// w.targetGlobalSettings = w.targetGlobalSettings || {};
// w.targetGlobalSettings.bodyHidingEnabled = checkTesting();

return loadScript(martechURL);
