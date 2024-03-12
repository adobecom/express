import {
  createTag,
  getConfig,
  loadScript,
  transformLinkToAnimation,
} from '../../scripts/utils.js';
import { buildFreePlanWidget } from '../../scripts/utils/free-plan.js';

const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
const imageInputAccept = '.png, .jpeg, .jpg';
let inputElement;
let quickAction;
let fqaBlock;
let error;
let ccEverywhere;
let quickActionContainer;
let uploadContainer;

function fade(element, action) {
  return new Promise((resolve) => {
    function onTransitionEnd() {
      if (action === 'out') {
        element.removeEventListener('transitionend', onTransitionEnd);
        element.classList.add('hidden');
      }
      resolve(); // Resolve the promise when the transition ends
    }

    if (action === 'in') {
      element.classList.remove('hidden');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          element.classList.remove('transparent');
          if (action === 'in') {
            resolve(); // For fading in, resolve immediately after removing 'transparent'
          }
        });
      });
    } else if (action === 'out') {
      element.classList.add('transparent');
      element.addEventListener('transitionend', onTransitionEnd);
    }
  });
}

function startSDK(data) {
  const CDN_URL = 'https://cc-embed.adobe.com/sdk/1p/v4/CCEverywhere.js';
  loadScript(CDN_URL).then(async () => {
    if (!window.CCEverywhere) {
      return;
    }
    if (!ccEverywhere) {
      let { ietf } = getConfig().locale;
      if (ietf === 'zh-Hant-TW') ietf = 'tw-TW';
      else if (ietf === 'zh-Hans-CN') ietf = 'cn-CN';
      let env = getConfig().env.name;
      if (env === 'local') env = 'dev';
      if (env === 'stage') env = 'preprod';

      const ccEverywhereConfig = {
        hostInfo: {
          clientId: 'b20f1d10b99b4ad892a856478f87cec3',
          appName: 'express',
        },
        configParams: {
          locale: ietf,
          env,
        },
        callbacks: {},
        authOption: { mode: 'delayed' },
      };

      ccEverywhere = await window.CCEverywhere.initialize(...Object.values(ccEverywhereConfig));
    }

    const exportConfig = [
      {
        id: 'download-button',
        label: 'Download',
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
        label: 'Edit in Adobe Express for free',
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
    await fade(uploadContainer, 'out');

    const modalParams = {
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
      metaData: { isFrictionlessQa: true },
      receiveQuickActionErrors: false,
    };

    switch (quickAction) {
      case 'convert-to-jpg':
        ccEverywhere.quickAction.convertToJPEG(docConfig, appConfig, exportConfig, modalParams);
        break;
      case 'convert-to-png':
        ccEverywhere.quickAction.convertToPNG(docConfig, appConfig, exportConfig, modalParams);
        break;
      case 'convert-to-svg':
        ccEverywhere.quickAction.convertToSVG(docConfig, appConfig, exportConfig, modalParams);
        break;
      case 'crop-image':
        ccEverywhere.quickAction.cropImage(docConfig, appConfig, exportConfig, modalParams);
        break;
      case 'resize-image':
        ccEverywhere.quickAction.resizeImage(docConfig, appConfig, exportConfig, modalParams);
        break;
      case 'remove-background':
        ccEverywhere.quickAction.removeBackground(docConfig, appConfig, exportConfig, modalParams);
        break;
      case 'generate-qr-code':
        ccEverywhere.quickAction.generateQRCode(docConfig, appConfig, exportConfig, modalParams);
        break;
      default: break;
    }
  });
}

function startSDKWithUnconvertedFile(file) {
  if (!file) return;
  const maxSize = 17 * 1024 * 1024; // 17 MB in bytes
  if (validImageTypes.includes(file.type) && file.size <= maxSize) {
    const reader = new FileReader();

    reader.onload = () => {
      window.history.pushState({ hideDropzone: true }, '', '');
      startSDK(reader.result);
    };

    // Read the file as a data URL (Base64)
    reader.readAsDataURL(file);
  } else if (!error) {
    let invalidInputError;
    if (!validImageTypes.includes(file.type)) invalidInputError = 'invalid image type. Please make sure your image format is one of the following: "image/png", "image/jpeg", "image/jpg"';
    else if (file.size > maxSize) invalidInputError = 'your image file is too large';

    error = createTag('p', {}, invalidInputError);
    const dropzoneButton = fqaBlock.querySelector(':scope .dropzone a.button');
    dropzoneButton?.before(error);
  }
}

function uploadFile() {
  if (!inputElement) {
    inputElement = document.createElement('input');
    inputElement.type = 'file';
    inputElement.accept = imageInputAccept;
  }
  // Trigger the file selector when the button is clicked
  inputElement.click();

  // Handle file selection
  inputElement.onchange = () => {
    const file = inputElement.files[0];
    startSDKWithUnconvertedFile(file);
  };
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

  if (animation && animation.href.includes('.mp4')) transformLinkToAnimation(animation);
  if (cta) cta.classList.add('xlarge');
  dropzone.classList.add('dropzone');

  dropzone.prepend(dropzoneBackground);
  dropzone.before(actionColumn);
  dropzoneContainer.append(dropzone);
  actionColumn.append(dropzoneContainer, gtcText);

  dropzoneContainer.addEventListener('click', (e) => {
    e.preventDefault();
    uploadFile();
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

  dropzoneContainer.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const { files } = dt;

    [...files].forEach(startSDKWithUnconvertedFile);
  }, false);

  const quickActionRow = rows.filter((r) => r.children && r.children[0].textContent.toLowerCase().trim() === 'quick-action');
  if (quickActionRow[0]) {
    quickAction = quickActionRow[0].children[1]?.textContent;
    quickActionRow[0].remove();
  }

  const freePlanTags = await buildFreePlanWidget({ typeKey: 'branded', checkmarks: true });
  dropzone.append(freePlanTags);

  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.hideDropzone) {
      quickActionContainer.remove();
      inputElement.value = '';
      fade(uploadContainer, 'in');
    }
  }, { passive: true });
}
