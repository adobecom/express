import { createTag, loadScript, transformLinkToAnimation } from '../../scripts/utils.js';
import { addFreePlanWidget, buildStaticFreePlanWidget } from '../../scripts/utils/free-plan.js';

const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
const imageInputAccept = '.png, .jpeg, .jpg';
let inputElement;
let quickAction;
let invalidInputError;
let fqaBlock;
let error;

function startSDK(data) {
  const CDN_URL = 'https://sdk.cc-embed.adobe.com/v3/CCEverywhere.js';
  loadScript(CDN_URL).then(async () => {
    if (!window.CCEverywhere) {
      return;
    }
    const ccEverywhere = await window.CCEverywhere.initialize({
      clientId: 'b20f1d10b99b4ad892a856478f87cec3',
      appName: 'express',
    });

    const exportOptions = [
      /* This native button renders label "Open in Adobe Express" */
      {
        target: 'Editor',
        id: 'edit-in-express',
        buttonType: 'native',
        optionType: 'button',
      },
      /* This native button renders label "Download" */
      {
        target: 'Download',
        id: 'download-button',
        optionType: 'button',
        buttonType: 'native',
      },
      {
        target: 'Host',
        id: 'my-custom-button',
        label: 'Embed in app',
        closeTargetOnExport: true,
        optionType: 'button',
        buttonType: 'custom',
      },
    ];

    const imageCallbacks = {
      onPublish: (publishParams) => {
        // Handle custom export button behavior here
        if (publishParams.exportButtonId == 'my-custom-button') {
          const localData = { asset: publishParams.asset[0].data };
          appImage.src = localData.asset;
        }
      },
    };

    console.log('opening crop image quick action');
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
      callbacks: imageCallbacks,
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
  const invalidInputErrorRow = rows.filter((r) => r.children && r.children[0].textContent.toLowerCase().trim() === 'invalid-input-error');
  if (invalidInputErrorRow[0]) {
    invalidInputError = invalidInputErrorRow[0].children[1]?.textContent;
    invalidInputErrorRow[0].remove();
  }

  const freePlanTags = await buildStaticFreePlanWidget(animationContainer);
  // dropzone.append(freePlanTags);
}
