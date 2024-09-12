import {
  createTag,
  getConfig,
  loadScript,
  transformLinkToAnimation,
  addAnimationToggle,
  fetchPlaceholders,
} from '../../scripts/utils.js';
import { buildFreePlanWidget } from '../../scripts/utils/free-plan.js';

// only allows 1 qa per page?
let quickAction;
let fqaBlock;
let error;
let ccEverywhere;
let quickActionContainer;
let uploadContainer;

const JPG = 'jpg';
const JPEG = 'jpeg';
const PNG = 'png';
export const getBaseImgCfg = (...types) => ({
  group: 'image',
  max_size: 40 * 1024 * 1024,
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
    ...getBaseImgCfg(PNG),
  },
  'convert-to-png': {
    ...getBaseImgCfg(JPG, JPEG),
  },
  'convert-to-svg': {
    ...getBaseImgCfg(JPG, JPEG, PNG),
  },
  'crop-image': {
    ...getBaseImgCfg(JPG, JPEG, PNG),
  },
  'resize-image': {
    ...getBaseImgCfg(JPG, JPEG, PNG),
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

async function startSDK(data = '') {
  const urlParams = new URLSearchParams(window.location.search);
  const CDN_URL = 'https://cc-embed.adobe.com/sdk/1p/v4/CCEverywhere.js';
  const clientId = 'AdobeExpressWeb';

  await loadScript(CDN_URL);
  if (!window.CCEverywhere) {
    return;
  }
  if (!ccEverywhere) {
    let { ietf } = getConfig().locale;
    // for testing
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
  fqaBlock.append(quickActionContainer);
  const divs = fqaBlock.querySelectorAll(':scope > div');
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

async function startSDKWithUnconvertedFile(file) {
  if (!file) return;
  const maxSize = QA_CONFIGS[quickAction].max_size ?? 40 * 1024 * 1024;
  if (QA_CONFIGS[quickAction].input_check(file.type) && file.size <= maxSize) {
    const reader = new FileReader();
    reader.onloadend = () => {
      window.history.pushState({ hideFrictionlessQa: true }, '', '');
      startSDK(reader.result);
    };

    // Read the file as a data URL (Base64)
    reader.readAsDataURL(file);
  } else if (!error) {
    const placeholders = await fetchPlaceholders();
    let invalidInputError;
    // FIXME: localize & placehold these messages
    if (!QA_CONFIGS[quickAction].input_check(file.type)) {
      invalidInputError = placeholders['file-type-not-supported'] ?? 'File type not supported.';
    } else if (file.size > maxSize) {
      invalidInputError = placeholders['file-size-not-supported'] ?? 'File size not supported.';
    }

    error = createTag('p', { class: 'input-error' }, invalidInputError);
    const dropzoneButton = fqaBlock.querySelector(':scope .dropzone a.button');
    dropzoneButton?.before(error);
  }
}

export default async function decorate(block) {
  // cache block element for the
  fqaBlock = block;

  const rows = Array.from(block.children);
  const actionAndAnimationRow = rows[1].children;
  const animationContainer = actionAndAnimationRow[0];
  const animation = animationContainer.querySelector('a');
  const dropzone = actionAndAnimationRow[1];
  const dropzoneBackground = createTag('div', { class: 'dropzone-bg' });
  const cta = dropzone.querySelector('a.button');
  const gtcText = dropzone.querySelector('p:last-child');
  const actionColumn = createTag('div');
  const dropzoneContainer = createTag('div', { class: 'dropzone-container' });

  if (animation && animation.href.includes('.mp4')) {
    transformLinkToAnimation(animation);
    addAnimationToggle(animationContainer);
  }
  if (cta) cta.classList.add('xlarge');
  dropzone.classList.add('dropzone');

  dropzone.prepend(dropzoneBackground);
  dropzone.before(actionColumn);
  dropzoneContainer.append(dropzone);
  actionColumn.append(dropzoneContainer, gtcText);
  const inputElement = createTag('input', { type: 'file', accept: QA_CONFIGS[quickAction].accept });
  inputElement.onchange = () => {
    const file = inputElement.files[0];
    startSDKWithUnconvertedFile(file);
  };
  // block.append(inputElement);

  dropzoneContainer.addEventListener('click', (e) => {
    e.preventDefault();
    if (quickAction === 'generate-qr-code') {
      startSDK();
    } else {
      inputElement.click();
    }
    document.body.dataset.suppressfloatingcta = 'true';
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    dropzoneContainer.classList.add('highlight');
  }

  function unhighlight() {
    dropzoneContainer.classList.remove('highlight');
  }

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzoneContainer.addEventListener(eventName, highlight, false);
  });

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    dropzoneContainer.addEventListener(eventName, preventDefaults, false);
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzoneContainer.addEventListener(eventName, unhighlight, false);
  });

  dropzoneContainer.addEventListener('drop', async (e) => {
    const dt = e.dataTransfer;
    const { files } = dt;

    await Promise.all([...files].map((file) => startSDKWithUnconvertedFile(file)));
    document.body.dataset.suppressfloatingcta = 'true';
  }, false);

  const quickActionRow = rows.filter((r) => r.children && r.children[0].textContent.toLowerCase().trim() === 'quick-action');
  if (quickActionRow[0]) {
    quickAction = quickActionRow[0].children[1]?.textContent;
    quickActionRow[0].remove();
  }

  const freePlanTags = await buildFreePlanWidget({ typeKey: 'branded', checkmarks: true });
  dropzone.append(freePlanTags);

  window.addEventListener('popstate', (e) => {
    const editorModal = selectElementByTagPrefix('cc-everywhere-container-');
    const correctState = e.state?.hideFrictionlessQa;
    const embedElsFound = quickActionContainer || editorModal;
    window.history.pushState({ hideFrictionlessQa: true }, '', '');
    if (correctState || embedElsFound) {
      quickActionContainer?.remove();
      editorModal?.remove();
      error?.remove();
      document.body.classList.remove('editor-modal-loaded');
      inputElement.value = '';
      fade(uploadContainer, 'in');
      document.body.dataset.suppressfloatingcta = 'false';
    }
  }, { passive: true });

  fqaBlock.dataset.frictionlesstype = quickAction;
  fqaBlock.dataset.frictionlessgroup = QA_CONFIGS[quickAction].group ?? 'image';
}
