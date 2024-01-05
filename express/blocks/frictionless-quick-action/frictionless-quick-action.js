import { loadScript } from '../../scripts/utils.js';

export default function decorate(block) {
  const CDN_URL = 'https://sdk.cc-embed.adobe.com/v3/CCEverywhere.js';
  loadScript(CDN_URL).then(async () => {
    if (!window.CCEverywhere) {
      return;
    }
    const ccEverywhere = await window.CCEverywhere.initialize({
      clientId: 'b20f1d10b99b4ad892a856478f87cec3',
      appName: 'express',
    });

    console.log('opening crop image quick action');
    ccEverywhere.openQuickAction({
      id: 'crop-image',
    });
  });
  // eslint-disable-next-line no-console
  console.log('quick action worked');
}
