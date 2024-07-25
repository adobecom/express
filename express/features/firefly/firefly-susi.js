import { getLibs } from '../../scripts/utils.js';

const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
const config = getConfig();
const fireflyprod = 'https://firefly.adobe.com';
const fireflystage = 'https://firefly-stage.corp.adobe.com';
const env = window.origin.includes(config.prodDomains[0]) ? 'prod' : 'stage';

function generateRandomSeed(min = 1, max = 100000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function redirectUrl(prompt, paramKey) {
  let windowLocation = '';
  const queryParam = 'ff_channel=adobe_com&ff_campaign=ffly_homepage&ff_source=firefly_seo';
  if (paramKey === 'goToFireflyGenFill') {
    windowLocation = env === 'prod' ? `${fireflyprod}/upload/inpaint?${queryParam}` : `${fireflystage}/upload/inpaint?&${queryParam}`;
  } else if (paramKey === 'goToFireflyEffects') {
    const effectsPath = `generate/font-styles?prompt=${encodeURI(prompt)}&${queryParam}`;
    windowLocation = env === 'prod' ? `${fireflyprod}/${effectsPath}` : `${fireflystage}/${effectsPath}`;
  } else if (paramKey === 'goToFirefly') {
    const fireflyPath = `generate/images?prompt=${encodeURI(prompt)}&${queryParam}&seed=${generateRandomSeed()}&seed=${generateRandomSeed()}&seed=${generateRandomSeed()}&seed=${generateRandomSeed()}&modelInputVersion=v3&modelConfig=v3`;
    windowLocation = env === 'prod' ? `${fireflyprod}/${fireflyPath}` : `${fireflystage}/${fireflyPath}`;
  }
  return windowLocation;
}

export default function signIn(prompt, paramKey) {
  const redirectUri = redirectUrl(prompt, paramKey);
  const stageSigninObj = { dctx_id: 'v:2,s,f,bg:firefly2023,2e2b3d80-4e50-11ee-acbc-ab67eaa89524', redirect_uri: redirectUri };
  const prodSigninObj = { dctx_id: 'v:2,s,f,bg:firefly2023,cea19bc0-4e72-11ee-888a-c95a795c7f23', redirect_uri: redirectUri };
  if (env === 'stage') window.adobeIMS?.signIn(stageSigninObj);
  else window.adobeIMS?.signIn(prodSigninObj);
}