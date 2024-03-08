import { loadScript } from '../../../../utils/utils.js';

export default function decorate(block) {
  window.qtId = 'remove-background';
  window.isWebViewHost = false;
  window.qtWebViewScheme = 'false';
  window.qtColorTheme = '';
  // eslint-disable-next-line no-underscore-dangle
  window._prjtmrvlsetup = { quickActionRegistryUrl: 'https://express.adobe.com/express-apps/quick-actions-api' };
  // eslint-disable-next-line no-underscore-dangle
  window._sparkImsOnReadyCalled = true;
  block.innerHTML = '<div id="quick-task-container"></div>';
  loadScript('https://express.adobe.com/static/platform-shell/standalone-host-app-e38b7076.js');
  // eslint-disable-next-line no-console
  console.log('challenger 1');
}
