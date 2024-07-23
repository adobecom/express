import { getLibs } from '../../scripts/utils.js';
import { defineDeviceByScreenSize } from '../../scripts/decorate.js';

export async function createPromptField(prompt, buttonText, mode, trackingValue = '') {
  const { createTag } = await import(`${getLibs()}/utils/utils.js`);
  const promptField = createTag('div', { id: 'promptbar', class: 'promptbar' });
  let promptInput = '';
  if (mode !== 'genfill') promptInput = createTag('input', { class: 'prompt-text', id: 'promptinput', placeholder: `${prompt.trim()}`, maxlength: '250', autofocus: 'true' });
  const promptButton = createTag('button', { class: 'con-button blue', id: 'promptbutton', 'daa-ll': trackingValue }, `${buttonText.trim()}`);
  if (mode.includes('light')) {
    promptField.classList.add('light');
    promptInput.classList.add('light');
  } else if (mode === 'genfill') {
    promptButton.setAttribute('id', 'genfill');
    promptField.classList.remove('promptbar');
  }
  if (mode.includes('ff-masonry')) {
    promptField.classList.remove('promptbar');
    promptField.classList.add('masonry-promptbar');
    promptInput.classList.remove('prompt-text');
    promptInput.classList.add('masonry-prompttext');
    promptInput.removeAttribute('id');
    promptButton.removeAttribute('id');
    promptButton.classList.add('masonry-generate');
  }
  if (mode !== 'genfill') {
    promptField.append(promptInput);
    promptInput.addEventListener('keydown', (event) => {
      if (event.keyCode === 13) {
        event.preventDefault();
        promptButton.click();
      }
      if (event.target.value.length === 0 && event.keyCode === 32) {
        if (event.preventDefault) event.preventDefault();
        else event.returnValue = false;
      }
    });
  }
  promptField.append(promptButton);
  const device = defineDeviceByScreenSize();
  if (device === 'DESKTOP' || (device === 'TABLET' && mode.includes('ff-masonry'))) promptButton.classList.add('button-xl');
  else if (device === 'TABLET') promptButton.classList.add('button-l');
  return promptField;
}

export async function createEnticement(enticementDetail, mode) {
  const { createTag } = await import(`${getLibs()}/utils/utils.js`);
  const enticementDiv = createTag('div', { class: 'enticement-container' });
  const svgImage = createTag('img', { class: 'enticement-arrow', alt: '' });
  let arrowText;
  [arrowText, svgImage.src] = enticementDetail.split('|');
  const enticementText = createTag('p', { class: 'enticement-text' }, arrowText.trim());
  enticementDiv.append(enticementText, svgImage);
  if (mode === 'light') enticementText.classList.add('light');
  return enticementDiv;
}

export async function createSelectorTray(interactiveSelections, mode) {
  const { createTag } = await import(`${getLibs()}/utils/utils.js`); 
  const options = createTag('div', { class: 'selector-tray' });
 
  [...interactiveSelections].forEach(async (option) => {
    const button = createTag('button', { class: `options ${option.id.trim()}`, 'daa-ll': `${option.analytics.trim()}` });
    const span = createTag('span', { class: 'button-text' }, `${option.text.trim()}`);
    const svgButton = createTag('img', { alt: '', class: 'optionsvg' });
    svgButton.src = option.svg.trim();
    const device = defineDeviceByScreenSize();
    if (mode === 'light') {
      button.classList.add('light');
      options.classList.add('light');
    }
    const buttonCount = options.querySelectorAll('button').length;
    if (((device === 'DESKTOP' || device === 'TABLET') && buttonCount < 4) || (device === 'MOBILE' && buttonCount < 3)) {
      button.prepend(svgButton);
      button.appendChild(span);
      options.append(button);
    }
  });
  console.log(options)
  options.lastChild.classList.add('last-button');
  return options;
}
