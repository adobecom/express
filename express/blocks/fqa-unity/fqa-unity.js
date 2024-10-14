import { createTag, transformLinkToAnimation, addAnimationToggle } from '../../scripts/utils.js';
import { buildFreePlanWidget } from '../../scripts/utils/free-plan.js';

const imageInputAccept = '.png, .jpeg, .jpg';

let inputElement;
let quickAction;
let error;
let quickActionContainer;
let uploadContainer;
let data;

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

async function createQAContainer(block) {
  const id = `${quickAction}-container`;
  quickActionContainer = createTag('div', { id, class: 'quick-action-container' });
  const mod = await import('./mock-container.js');
  data = mod.data;
  await mod.default(quickActionContainer);
  block.append(quickActionContainer);
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


function uploadFile(block) {
  if (!inputElement) {
    inputElement = createTag('input', { type: 'file', accept: imageInputAccept, class: 'file-input' });
    block.append(inputElement)
  }
  // Trigger the file selector when the button is clicked
  inputElement.click();

  // Handle file selection
  inputElement.onchange = () => {
    window.history.pushState({ hideFrictionlessQa: true }, '', '');
    if (data) data.value = { showWorkspace: true };
    fade(uploadContainer, 'out');
  };
}

export default async function decorate(block) {
  const rows = Array.from(block.children);
  [, uploadContainer] = rows;
  uploadContainer.classList.add('upload-container');
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
  if(!inputElement){
    inputElement = createTag('input', { type: 'file', accept: imageInputAccept, class: 'file-input' });
    block.append(inputElement)
  }

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
      inputElement.files = files;
      inputElement.dispatchEvent(new Event('change'));
      if (data) data.value = { showWorkspace: true };
      fade(uploadContainer, 'out');
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
      const correctState = e.state?.hideFrictionlessQa;
      const embedElsFound = quickActionContainer;
      window.history.pushState({ hideFrictionlessQa: true }, '', '');
      if (correctState || embedElsFound) {
        document.body.classList.remove('editor-modal-loaded');
        if (inputElement) inputElement.value = '';
        fade(uploadContainer, 'in');
        if (data) data.value = { showWorkspace: false };
        document.body.dataset.suppressfloatingcta = 'false';
      }
    },
    { passive: true },
  );

  block.dataset.frictionlesstype = quickAction;
  block.dataset.frictionlessgroup = getQAGroup(quickAction);

  createQAContainer(block);
}
