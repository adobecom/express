import { createTag, transformLinkToAnimation, addAnimationToggle } from '../../scripts/utils.js';
import { buildFreePlanWidget } from '../../scripts/utils/free-plan.js';

const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
const imageInputAccept = '.png, .jpeg, .jpg';
const sizeLimits = {
  image: 40 * 1024 * 1024,
  video: 1024 * 1024 * 1024,
};

let inputElement;
let quickAction;
let error;
let quickActionContainer;
let uploadContainer;

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

// eslint-disable-next-line no-unused-vars
async function startSDK(data = '', block) {
  const id = `${quickAction}-container`;
  quickActionContainer = createTag('div', { id, class: 'quick-action-container' });
  const { default: initUnityPOC } = await import('./mock-container.js');
  await initUnityPOC(quickActionContainer);
  block.append(quickActionContainer);
  const divs = block.querySelectorAll(':scope > div');
  if (divs[1]) [, uploadContainer] = divs;
  fade(uploadContainer, 'out');
}

function getQAGroup() {
  if (
    [
      'convert-to-jpg',
      'convert-to-png',
      'convert-to-svg',
      'crop-image',
      'resize-image',
      'remove-background',
      'generate-qr-code',
    ].includes(quickAction)
  ) {
    return 'image';
  }
  // update list of video qas here
  if ([].includes(quickAction)) return 'video';
  // fallback to image until we have real video QA
  return 'image';
}

function startSDKWithUnconvertedFile(file, block) {
  if (!file) return;
  const maxSize = sizeLimits[getQAGroup()] ?? 40 * 1024 * 1024;
  if (validImageTypes.includes(file.type) && file.size <= maxSize) {
    const reader = new FileReader();
    reader.onloadend = () => {
      window.history.pushState({ hideFrictionlessQa: true }, '', '');
      startSDK(reader.result, block);
    };

    // Read the file as a data URL (Base64)
    reader.readAsDataURL(file);
  } else if (!error) {
    let invalidInputError;
    if (!validImageTypes.includes(file.type)) {
      invalidInputError = 'invalid image type. Please make sure your image format is one of the following: "image/png", "image/jpeg", "image/jpg"';
    } else if (file.size > maxSize) {
      invalidInputError = 'your image file is too large';
    }

    error = createTag('p', {}, invalidInputError);
    const dropzoneButton = block.querySelector(':scope .dropzone a.button');
    dropzoneButton?.before(error);
  }
}

function uploadFile(block) {
  if (!inputElement) {
    inputElement = createTag('input', { type: 'file', accept: imageInputAccept });
  }
  // Trigger the file selector when the button is clicked
  inputElement.click();

  // Handle file selection
  inputElement.onchange = () => {
    const file = inputElement.files[0];
    startSDKWithUnconvertedFile(file, block);
  };
}

export default async function decorate(block) {
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

  dropzoneContainer.addEventListener('click', (e) => {
    e.preventDefault();
    uploadFile(block);
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

  dropzoneContainer.addEventListener(
    'drop',
    (e) => {
      const dt = e.dataTransfer;
      const { files } = dt;

      [...files].forEach((file) => startSDKWithUnconvertedFile(file, block));
      document.body.dataset.suppressfloatingcta = 'true';
    },
    false,
  );

  const quickActionRow = rows.filter(
    (r) => r.children && r.children[0].textContent.toLowerCase().trim() === 'quick-action',
  );
  if (quickActionRow[0]) {
    quickAction = quickActionRow[0].children[1]?.textContent;
    quickActionRow[0].remove();
  }

  const freePlanTags = await buildFreePlanWidget({ typeKey: 'branded', checkmarks: true });
  dropzone.append(freePlanTags);

  window.addEventListener(
    'popstate',
    (e) => {
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
    },
    { passive: true },
  );

  block.dataset.frictionlesstype = quickAction;
  block.dataset.frictionlessgroup = getQAGroup(quickAction);

  startSDK('', block);
}
