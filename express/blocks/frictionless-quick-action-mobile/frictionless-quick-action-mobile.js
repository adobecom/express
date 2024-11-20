import {
  createTag,
  getConfig,
  loadScript,
  transformLinkToAnimation,
  fetchPlaceholders,
  getIconElement,
} from '../../scripts/utils.js';
import { sendFrictionlessEventToAdobeAnaltics } from '../../scripts/instrument.js';

let ccEverywhere;
let quickActionContainer;
let uploadContainer;

const JPG = 'jpg';
const JPEG = 'jpeg';
const PNG = 'png';
const WEBP = 'webp';
export const getBaseImgCfg = (...types) => ({
  group: 'image',
  max_size: 40 * 1024 * 1024,
  accept: types.map((type) => `.${type}`).join(', '),
  input_check: (input) => types.map((type) => `image/${type}`).includes(input),
});
export const getBaseVideoCfg = (...types) => ({
  group: 'video',
  max_size: 1024 * 1024 * 1024,
  accept: types.map((type) => `.${type}`).join(', '),
  input_check: (input) => types.map((type) => `video/${type}`).includes(input),
});
const QA_CONFIGS = {
  'convert-to-jpg': {
    ...getBaseImgCfg(PNG, WEBP),
  },
  'convert-to-png': {
    ...getBaseImgCfg(JPG, JPEG, WEBP),
  },
  'convert-to-svg': {
    ...getBaseImgCfg(JPG, JPEG, PNG),
  },
  'crop-image': {
    ...getBaseImgCfg(JPG, JPEG, PNG),
  },
  'resize-image': {
    ...getBaseImgCfg(JPG, JPEG, PNG, WEBP),
  },
  'remove-background': {
    ...getBaseImgCfg(JPG, JPEG, PNG),
  },
  'generate-qr-code': {
    ...getBaseImgCfg(JPG, JPEG, PNG),
    input_check: () => true,
  },
};

function fade(element, action) {
  if (action === 'in') {
    element.classList.remove('hidden');
    setTimeout(() => {
      element.classList.remove('transparent');
    }, 10);
  } else if (action === 'out') {
    element.classList.add('transparent');
    setTimeout(() => {
      element.classList.add('hidden');
    }, 200);
  }
}

function selectElementByTagPrefix(p) {
  const allEls = document.body.querySelectorAll(':scope > *');
  return Array.from(allEls).find((e) => e.tagName.toLowerCase().startsWith(p.toLowerCase()));
}

export function runQuickAction(quickAction, data, block) {
  // TODO: need the button labels from the placeholders sheet if the SDK default doens't work.
  const exportConfig = [
    {
      id: 'download-button',
      // label: 'Download',
      action: {
        target: 'download',
      },
      style: {
        uiType: 'button',
      },
      buttonStyle: {
        variant: 'secondary',
        treatment: 'fill',
        size: 'xl',
      },
    },
    {
      id: 'edit-in-express',
      // label: 'Edit in Adobe Express for free',
      action: {
        target: 'express',
      },
      style: {
        uiType: 'button',
      },
      buttonStyle: {
        variant: 'primary',
        treatment: 'fill',
        size: 'xl',
      },
    },
  ];

  const id = `${quickAction}-container`;
  quickActionContainer = createTag('div', { id, class: 'quick-action-container' });
  block.append(quickActionContainer);
  const divs = block.querySelectorAll(':scope > div');
  if (divs[1]) [, uploadContainer] = divs;
  fade(uploadContainer, 'out');

  const contConfig = {
    mode: 'inline',
    parentElementId: `${quickAction}-container`,
    backgroundColor: 'transparent',
    hideCloseButton: true,
  };

  const docConfig = {
    asset: {
      data,
      dataType: 'base64',
      type: 'image',
    },
  };
  const appConfig = {
    metaData: { isFrictionlessQa: 'true' },
    receiveQuickActionErrors: false,
    callbacks: {
      onIntentChange: () => {
        quickActionContainer?.remove();
        fade(uploadContainer, 'in');
        document.body.classList.add('editor-modal-loaded');
        window.history.pushState({ hideFrictionlessQa: true }, '', '');
        return {
          containerConfig: {
            mode: 'modal',
            zIndex: 999,
          },
        };
      },
      onCancel: () => {
        window.history.back();
      },
    },
  };

  if (!ccEverywhere) return;
  switch (quickAction) {
    case 'convert-to-jpg':
      ccEverywhere.quickAction.convertToJPEG(docConfig, appConfig, exportConfig, contConfig);
      break;
    case 'convert-to-png':
      ccEverywhere.quickAction.convertToPNG(docConfig, appConfig, exportConfig, contConfig);
      break;
    case 'convert-to-svg':
      exportConfig.pop();
      ccEverywhere.quickAction.convertToSVG(docConfig, appConfig, exportConfig, contConfig);
      break;
    case 'crop-image':
      ccEverywhere.quickAction.cropImage(docConfig, appConfig, exportConfig, contConfig);
      break;
    case 'resize-image':
      ccEverywhere.quickAction.resizeImage(docConfig, appConfig, exportConfig, contConfig);
      break;
    case 'remove-background':
      ccEverywhere.quickAction.removeBackground(docConfig, appConfig, exportConfig, contConfig);
      break;
    case 'generate-qr-code':
      ccEverywhere.quickAction.generateQRCode({}, appConfig, exportConfig, contConfig);
      break;
    default: break;
  }
}

async function startSDK(data = '', quickAction, block) {
  const urlParams = new URLSearchParams(window.location.search);
  const urlOverride = urlParams.get('sdk-override');
  let valid = false;
  if (urlOverride) {
    try {
      if (new URL(urlOverride).host === 'dev.cc-embed.adobe.com') valid = true;
    } catch (e) {
      window.lana.log('Invalid SDK URL');
    }
  }
  const CDN_URL = valid ? urlOverride : 'https://cc-embed.adobe.com/sdk/1p/v4/CCEverywhere.js';
  const clientId = 'AdobeExpressWeb';

  await loadScript(CDN_URL);
  if (!window.CCEverywhere) {
    return;
  }

  if (!ccEverywhere) {
    let { ietf } = getConfig().locale;
    const country = urlParams.get('country');
    if (country) ietf = getConfig().locales[country]?.ietf;
    if (ietf === 'zh-Hant-TW') ietf = 'tw-TW';
    else if (ietf === 'zh-Hans-CN') ietf = 'cn-CN';

    const ccEverywhereConfig = {
      hostInfo: {
        clientId,
        appName: 'express',
      },
      configParams: {
        locale: ietf?.replace('-', '_'),
        env: urlParams.get('hzenv') === 'stage' ? 'stage' : 'prod',
      },
      authOption: () => ({
        mode: 'delayed',
      }),
    };

    ccEverywhere = await window.CCEverywhere.initialize(...Object.values(ccEverywhereConfig));
  }

  runQuickAction(quickAction, data, block);
}

let timeoutId = null;
function showErrorToast(block, msg) {
  let toast = block.querySelector('.error-toast');
  const hideToast = () => toast.classList.add('hide');
  if (!toast) {
    toast = createTag('div', { class: 'error-toast hide' });
    toast.prepend(getIconElement('error'));
    const close = createTag('button', {}, getIconElement('close-white'));
    close.addEventListener('click', hideToast);
    toast.append(close);
    block.append(toast);
  }
  toast.textContent = msg;
  toast.classList.remove('hide');
  clearTimeout(timeoutId);
  timeoutId = setTimeout(hideToast, 6000);
}

async function startSDKWithUnconvertedFile(file, quickAction, block) {
  if (!file) return;
  const maxSize = QA_CONFIGS[quickAction].max_size ?? 40 * 1024 * 1024;
  if (QA_CONFIGS[quickAction].input_check(file.type) && file.size <= maxSize) {
    const reader = new FileReader();
    reader.onloadend = () => {
      window.history.pushState({ hideFrictionlessQa: true }, '', '');
      startSDK(reader.result, quickAction, block);
    };

    // Read the file as a data URL (Base64)
    reader.readAsDataURL(file);
    return;
  }
  const placeholders = await fetchPlaceholders();
  let msg;
  if (!QA_CONFIGS[quickAction].input_check(file.type)) {
    msg = placeholders['file-type-not-supported'] ?? 'File type not supported.';
  } else {
    msg = placeholders['file-size-not-supported'] ?? 'File size not supported.';
  }
  showErrorToast(block, msg);
}

export default async function decorate(block) {
  const rows = Array.from(block.children);
  const quickActionRow = rows[rows.length - 1];
  const quickAction = quickActionRow.children[1]?.textContent;
  if (!quickAction || !(quickAction in QA_CONFIGS)) {
    throw new Error('Invalid Quick Action Type.');
  }
  quickActionRow.remove();

  rows[0].classList.add('headline');
  rows[1].classList.add('dropzone-container');
  const [animationContainer, dropzone] = rows[1].children;
  animationContainer.classList.add('animation-container');
  const animation = animationContainer.querySelector('a');

  if (animation && animation.href.includes('.mp4')) {
    const video = transformLinkToAnimation(animation, false);
    video.addEventListener('ended', () => {
      dropzone.classList.remove('hide');
      animationContainer.classList.add('hide');
    });
    // click to skip animation
  }
  dropzone.classList.add('dropzone', 'hide');
  const dropzoneText = createTag('div', { class: 'text' });
  while (dropzone.firstChild) {
    dropzoneText.append(dropzone.firstChild);
  }
  dropzone.classList.add('dropzone');
  dropzone.append(createTag('div', { class: 'border-wrapper' }, dropzoneText));
  const inputElement = createTag('input', { type: 'file', accept: QA_CONFIGS[quickAction].accept });
  inputElement.onchange = () => {
    const file = inputElement.files[0];
    startSDKWithUnconvertedFile(file, quickAction, block);
  };
  block.append(inputElement);

  dropzone.addEventListener('click', (e) => {
    e.preventDefault();
    if (quickAction === 'generate-qr-code') {
      startSDK('', quickAction, block);
    } else {
      inputElement.click();
    }
    document.body.dataset.suppressfloatingcta = 'true';
  });

  window.addEventListener('popstate', (e) => {
    const editorModal = selectElementByTagPrefix('cc-everywhere-container-');
    const correctState = e.state?.hideFrictionlessQa;
    const embedElsFound = quickActionContainer || editorModal;
    window.history.pushState({ hideFrictionlessQa: true }, '', '');
    if (correctState || embedElsFound) {
      quickActionContainer?.remove();
      editorModal?.remove();
      document.body.classList.remove('editor-modal-loaded');
      inputElement.value = '';
      fade(uploadContainer, 'in');
      document.body.dataset.suppressfloatingcta = 'false';
    }
  }, { passive: true });

  block.dataset.frictionlesstype = quickAction;
  block.dataset.frictionlessgroup = QA_CONFIGS[quickAction].group ?? 'image';

  // const logo = getIconElement('adobe-express-logo');
  // logo.classList.add('express-logo');
  // block.prepend(logo);

  sendFrictionlessEventToAdobeAnaltics(block);
}
