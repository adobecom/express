import { createTag, getConfig, getIconElement, loadScript, transformLinkToAnimation } from '../../scripts/utils.js';
import { buildFreePlanWidget } from '../../scripts/utils/free-plan.js';

const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
const imageInputAccept = '.png, .jpeg, .jpg';
let inputElement;
let quickAction;
let fqaBlock;
let error;
let ccEverywhere;
let container;

function startSDK(data) {
  const CDN_URL = 'https://sdk-pr-builds.cc-embed.adobe.com/PR-1339/PR-1339/CCEverywhere.js';
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
        variant: 'secondary',
        buttonType: 'native',
        treatment: 'fill',
        size: "xl"
      },
      {
        target: 'Editor',
        id: 'edit-in-express',
        buttonType: 'native',
        optionType: 'button',
        treatment: 'fill',
        size: "xl"
      }
    ];

    const id = `${quickAction}-container`;
    // if(container) container.remove();
    container = createTag('div', { id, class: 'quick-action-container' });
    fqaBlock.append(container);
    const divs = fqaBlock.querySelectorAll(':scope > div');
    divs[1].style.display = 'none';
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
        isFrictionlessQa: true,
        parentElementId: `${quickAction}-container`,
        backgroundColor: 'transparent',
        hideCloseButton: true,
      },
    });
  });
}

function startSDKWithUnconvertedFile(file) {
  if (!file) return;
  const maxSize = 17 * 1024 * 1024; // 17 MB in bytes
  if (validImageTypes.includes(file.type) && file.size <= maxSize) {
    const reader = new FileReader();

    reader.onloadend = function () {
      console.log('Base64 string:', reader.result);
      startSDK(reader.result);
    };

    // Read the file as a data URL (Base64)
    reader.readAsDataURL(file);
  } else if (!error) {
    error = createTag('p', {}, invalidInputError);
    const dropzoneButton = fqaBlock.querySelector(':scope .dropzone a.button');
    dropzoneButton.parentElement.insertBefore(error, dropzoneButton);
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
  fqaBlock = block;
  const rows = Array.from(block.children);
  const actionAndAnimationRow = rows[1].children;
  const animationContainer = actionAndAnimationRow[0];
  const animation = animationContainer.querySelector('a');
  if (animation && animation.href.includes('.mp4')) transformLinkToAnimation(animation);
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
}
