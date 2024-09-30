const localeMap = {
    '': 'en-us',
    br: 'pt-br',
    cn: 'zh-hans-cn',
    de: 'de-de',
    dk: 'da-dk',
    es: 'es-es',
    fi: 'fi-fi',
    fr: 'fr-fr',
    gb: 'en-gb',
    id_id: 'id-id',
    in: 'en-in',
    it: 'it-it',
    jp: 'ja-jp',
    kr: 'ko-kr',
    nl: 'nl-nl',
    no: 'no-no',
    se: 'sv-se',
    tr: 'tr-tr',
    tw: 'zh-hant-tw',
    uk: 'en-gb'
};
  
function getUnityLibs(prodLibs = '/unitylibs') {
  const { hostname } = window.location;
  if (!hostname.includes('hlx.page')
    && !hostname.includes('hlx.live')
    && !hostname.includes('localhost')) {
    return prodLibs;
  }
  // eslint-disable-next-line compat/compat
  const branch = new URLSearchParams(window.location.search).get('unitylibs') || 'main';
  if (branch.indexOf('--') > -1) return `https://${branch}.hlx.live/unitylibs`;
  return `https://${branch}--unity--adobecom.hlx.live/unitylibs`;
}

export default async function init(el) {
  let mobileApp;
  if ((/iPad|iPhone|iPod/.test(window.browser?.ua) && !window.MSStream)
    || /android/i.test(window.browser?.ua)) {
    mobileApp = true;
  }

  if (mobileApp) return;
  const unitylibs = getUnityLibs();
  const langFromPath = window.location.pathname.split('/')[1];
  const languageCode = localeMap[langFromPath] ? localeMap[langFromPath].split('-')[0] : 'en';
  const languageRegion = localeMap[langFromPath] ? localeMap[langFromPath].split('-')[1] : 'us';
  const { default: wfinit } = await import(`${unitylibs}/core/workflow/workflow.js`);
  await wfinit(el, 'photoshop', unitylibs, 'v2', languageRegion, languageCode);
}
