import {
  createTag, getConfig, getLottie, lazyLoadLottiePlayer, loadScript, transformLinkToAnimation,
} from '../../scripts/utils.js';
import { addFreePlanWidget, buildStaticFreePlanWidget } from '../../scripts/utils/free-plan.js';

const imageInputAccept = '.png, .jpeg, .jpg';
let inputElement;
let quickAction;
let ccEverywhere;

function startSDK(data) {
  const CDN_URL = 'https://sdk.cc-embed.adobe.com/v3/CCEverywhere.js';
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
      ccEverywhere = await window.CCEverywhere.initialize({
        clientId: 'b20f1d10b99b4ad892a856478f87cec3',
        appName: 'express',
      }, {
        loginMode: 'delayed',
        locale: ietf,
        env,
      });
    }

    const exportOptions = [
      {
        target: 'Download',
        id: 'download-button',
        optionType: 'button',
        buttonType: 'native',
      },
      {
        target: 'Editor',
        id: 'edit-in-express',
        buttonType: 'native',
        optionType: 'button',
      },
    ];

    ccEverywhere.openQuickAction({
      id: quickAction,
      inputParams: {
        asset: {
          data,
          dataType: 'base64',
          type: 'image',
        },
        exportOptions,
      },
      modalParams: {
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
      },
    });
  });
}

function startSDKWithUnconvertedFile(file) {
  if (!file) return;
  const reader = new FileReader();

  reader.onloadend = function () {
    console.log('Base64 string:', reader.result);
    startSDK(reader.result);
  };

  // Read the file as a data URL (Base64)
  reader.readAsDataURL(file);
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
  const rows = Array.from(block.children);
  const actionAndAnimationRow = rows[1].children;
  const animationContainer = actionAndAnimationRow[0];
  const animation = animationContainer.querySelector('a');
  if (animation && animation.href.includes('.mp4')) transformLinkToAnimation(animation);
  const video = animationContainer.querySelector('video');
  const videoPromise = new Promise((resolve) => {
    video.addEventListener('loadeddata', () => {
      resolve();
    }, false);
    setTimeout(() => resolve(), 2000);
  });
  const dropzone = actionAndAnimationRow[1];
  dropzone.classList.add('dropzone');
  const dropzoneBackground = createTag('div', { class: 'dropzone-bg' });
  dropzone.prepend(dropzoneBackground);
  const cta = dropzone.querySelector('a.button');
  if (cta) cta.classList.add('xlarge');
  const gtcText = dropzone.querySelector('p:last-child');
  const actionColumn = createTag('div');
  const dropzoneContainer = createTag('div', { class: 'dropzone-container' });
  dropzone.parentElement.insertBefore(actionColumn, dropzone);
  dropzoneContainer.append(dropzone);
  actionColumn.append(dropzoneContainer);
  actionColumn.append(gtcText);

  const span = cta.querySelector(':scope span');
  if (span) {
    const lottieUpload = [...span.classList].filter((c) => c === 'icon-lottie-arrow-up');
    if (lottieUpload.length) {
      span.remove();
      cta.innerHTML = getLottie('lottie-arrow-up', '/express/icons/arrow-up-lottie.json') + cta.innerHTML;
      lazyLoadLottiePlayer();
    }
  }

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

  const freePlanTags = await buildStaticFreePlanWidget(animationContainer);

  await videoPromise;
  // dropzone.append(freePlanTags);
}
