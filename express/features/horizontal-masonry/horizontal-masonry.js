import { createTag, getIconElement } from '../../scripts/utils.js';

const promptTokenRegex = new RegExp('(%7B%7B|{{)prompt-text(%7D%7D|}})');

export const windowHelper = {
  redirect: (url) => {
    window.location.assign(url);
  },
};

function handleGenAISubmit(form, link) {
  const input = form.querySelector('input');
  if (input.value.trim() === '') return;
  const genAILink = link.replace(promptTokenRegex, encodeURI(input.value).replaceAll(' ', '+'));
  const urlObj = new URL(genAILink);
  urlObj.searchParams.delete('referrer');
  if (genAILink) windowHelper.redirect(urlObj.toString());
}

function createEnticement(enticementDetail, enticementLink, mode) {
  const enticementDiv = createTag('div', { class: 'enticement-container' });
  const svgImage = getIconElement('enticement-arrow', 60);
  const arrowText = enticementDetail;
  const enticementText = createTag('span', { class: 'enticement-text' }, arrowText.trim());
  const input = createTag('input', { type: 'text', placeholder: 'Describe your image...' });
  const buttonContainer = createTag('span', { class: 'button-container' });
  const button = createTag('button', { class: 'generate-small-btn' });
  buttonContainer.append(button);
  button.textContent = 'Generate';
  button.addEventListener('click', () => handleGenAISubmit(enticementDiv, enticementLink));
  enticementDiv.append(enticementText, svgImage, input, buttonContainer);
  if (mode === 'light') enticementText.classList.add('light');
  return enticementDiv;
}

function createPromptLinkElement(promptLink) {
  const icon = getIconElement('external-link', 22);
  icon.classList.add('link');
  icon.addEventListener('click', () => {
    const link = promptLink.querySelector('a').href;
    const urlObj = new URL(link);
    urlObj.searchParams.delete('referrer');
    windowHelper.redirect(urlObj.toString());
  });
  return icon;
}

export default async function setHorizontalMasonry(el) {
  const args = el.querySelectorAll('.interactive-container > .asset > p');
  const container = el.querySelector('.interactive-container .asset');
  container.classList.add('media-container');

  const enticementElement = args[0].querySelector('a');
  const enticementMode = el.classList.contains('light') ? 'light' : 'dark';
  const enticementText = enticementElement.textContent.trim();
  const enticementLink = enticementElement.href;
  args[0].remove();

  el.querySelector('.interactive-container').appendChild(createEnticement(enticementText, enticementLink, enticementMode));
  for (let i = 1; i < args.length; i += 4) {
    const divider = args[i];
    divider.remove();
    const link = args[i + 1];
    const prompt = args[i + 2];
    prompt.classList.add('overlay');
    const title = createTag('div', { class: 'prompt-title' });
    title.textContent = 'Prompt used';
    prompt.prepend(title);
    const image = args[i + 3];
    image.classList.add('image-container');
    image.appendChild(prompt);
    image.appendChild(createPromptLinkElement(link));
    link.remove();
  }
}
