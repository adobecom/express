import { createTag, loadScript, transformLinkToAnimation } from '../../scripts/utils.js';
import { addFreePlanWidget, buildStaticFreePlanWidget } from '../../scripts/utils/free-plan.js';

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
      id: 'remove-background',
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
  // eslint-disable-next-line no-console
  console.log('quick action worked');
}

function uploadFile() {
  // Create an input element
  const inputElement = document.createElement('input');
  inputElement.type = 'file';

  // Trigger the file selector when the button is clicked
  inputElement.click();

  // Handle file selection
  inputElement.onchange = () => {
    const file = inputElement.files[0];
    const reader = new FileReader();

    reader.onloadend = function () {
      console.log('Base64 string:', reader.result);
      startSDK(reader.result);
    };

    // Read the file as a data URL (Base64)
    reader.readAsDataURL(file);
  };
}

export default async function decorate(block) {
  const button = createTag('button', {}, 'remove background');
  const rows = Array.from(block.children);
  const actionAndAnimationRow = rows[1].children;
  const animationContainer = actionAndAnimationRow[0];
  const animation = animationContainer.querySelector('a');
  if (animation && animation.href.includes('.mp4')) transformLinkToAnimation(animation);
  const dropzone = actionAndAnimationRow[1];
  dropzone.classList.add('dropzone');

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

  const freePlanTags = await buildStaticFreePlanWidget(animationContainer);
  dropzone.append(freePlanTags);

  block.append(button);
}
