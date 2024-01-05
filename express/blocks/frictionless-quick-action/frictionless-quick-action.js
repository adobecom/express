import { createTag, loadScript } from '../../scripts/utils.js';

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
        optionType: 'button'
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
        debugger;
        if (publishParams.exportButtonId=="my-custom-button"){
          const localData = { asset: publishParams.asset[0].data }
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
      callbacks: imageCallbacks
    });

  });
  // eslint-disable-next-line no-console
  console.log('quick action worked');
}

function uploadFile() {
  // Create an input element
  let inputElement = document.createElement('input');
  inputElement.type = 'file';

  // Trigger the file selector when the button is clicked
  inputElement.click();

  // Handle file selection
  inputElement.onchange = function() {
    let file = inputElement.files[0];
    let reader = new FileReader();

    reader.onloadend = function() {
      // The file content is in reader.result as a Base64 encoded string
      console.log('Base64 string:', reader.result);
      startSDK(reader.result);
      // You can add additional code here to use the Base64 string
    };

    // Read the file as a data URL (Base64)
    reader.readAsDataURL(file);
  };
}

export default function decorate(block) {


  const button = createTag('button', {}, 'remove background');

  button.addEventListener("click", () => {
    uploadFile();
  });

  block.append(button);


}
