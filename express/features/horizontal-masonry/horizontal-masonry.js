import {
  createTag, getIconElement, fetchPlaceholders, getMetadata,
} from '../../scripts/utils.js';

const promptTokenRegex = new RegExp('(%7B%7B|{{)prompt-text(%7D%7D|}})');

export const windowHelper = {
  redirect: (url) => {
    window.location.assign(url);
  },
};

// List of placeholders required
// 'describe-image-mobile
// 'describe-image-desktop
// 'generate'
// 'use-this-prompt'
// 'prompt-title'

function handleGenAISubmit(form, link) {
  const input = form.querySelector('input');
  if (input.value.trim() === '') return;
  const genAILink = link.replace(promptTokenRegex, encodeURI(input.value).replaceAll(' ', '+'));
  const urlObj = new URL(genAILink);
  urlObj.searchParams.delete('referrer');
  if (genAILink) windowHelper.redirect(urlObj.toString());
}

function createEnticement(enticementDetail, enticementPlaceholder,
  enticementPlaceholerMobile, enticementLink, mode, placeholders) {
  const enticementDiv = createTag('div', { class: 'enticement-container' });
  const svgImage = getIconElement('enticement-arrow', 60);
  const arrowText = enticementDetail;
  const enticementText = createTag('span', { class: 'enticement-text' }, arrowText.trim());
  const input = createTag('input', { type: 'text', placeholder: window.screen.width < 600 ? enticementPlaceholerMobile : enticementPlaceholder });
  const buttonContainer = createTag('span', { class: 'button-container' });
  const button = createTag('button', { class: 'generate-small-btn' });
  buttonContainer.append(button);
  button.textContent = placeholders?.generate || 'Generate';
  button.addEventListener('click', () => handleGenAISubmit(enticementDiv, enticementLink));
  enticementDiv.append(enticementText, svgImage, input, buttonContainer);
  if (mode === 'light') enticementText.classList.add('light');
  return enticementDiv;
}

function createPromptLinkElement(promptLink, prompt, placeholders) {
  const icon = getIconElement('external-link', 22);
  icon.classList.add('link');
  icon.addEventListener('click', () => {
    const urlObj = new URL(promptLink);
    urlObj.searchParams.delete('referrer');
    urlObj.searchParams.append('prompt', prompt);
    windowHelper.redirect(urlObj.toString());
  });
  const wrapper = createTag('div', { class: 'external-link-element' });
  const usePrompt = createTag('div', { class: 'mobile-prompt-link' });
  usePrompt.textContent = (placeholders && placeholders['use-this-prompt']) || 'Use this prompt';
  wrapper.appendChild(usePrompt);
  usePrompt.appendChild(icon);
  return wrapper;
}

const LOGO = 'adobe-express-logo';
function injectExpressLogo(block, wrapper) {
  if (block.classList.contains('entitled')) return;
  if (!['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase())) return;
  const logo = getIconElement(LOGO, '22px');
  logo.classList.add('express-logo');
  wrapper.prepend(logo);
}

export default async function setHorizontalMasonry(el) {
  const placeholders = await fetchPlaceholders();
  const link = el.querySelector(':scope .con-button');
  if (!link) {
    console.error('Missing Generate Link');
    return;
  }

  const args = el.querySelectorAll('.interactive-container > .asset > p');
  const container = el.querySelector('.interactive-container .asset');
  container.classList.add('media-container');

  const enticementElement = args[0].querySelector('a');
  const enticementMode = el.classList.contains('light') ? 'light' : 'dark';
  const enticementText = enticementElement.textContent.trim();
  const enticementLink = enticementElement.href;
  const enticementPlaceholder = args[1].textContent;
  const enticementPlaceholerMobile = args[2].textContent;
  args[0].remove();
  args[1].remove();
  args[2].remove();

  el.querySelector('.interactive-container').appendChild(
    createEnticement(enticementText, enticementPlaceholder,
      enticementPlaceholerMobile, enticementLink, enticementMode, placeholders),
  );
  for (let i = 3; i < args.length; i += 3) {
    const divider = args[i];
    divider.remove();
    const prompt = args[i + 1];
    prompt.classList.add('overlay');

    const pictureContainer = args[i + 2];
    pictureContainer.classList.add('image-container');
    pictureContainer.appendChild(prompt);
    pictureContainer.appendChild(
      createPromptLinkElement(link.href, prompt.textContent, placeholders),
    );

    const image = pictureContainer.querySelector('img');
    console.log(image);
    if (image.width < image.height) {
      console.log('image tall');
      image.classList.add('tall-prompt-image');
    }

    const title = createTag('div', { class: 'prompt-title' });
    title.textContent = (placeholders && placeholders['prompt-title']) || 'Prompt used';
    prompt.prepend(title);
  }

  injectExpressLogo(el, el.querySelector('.foreground > .text'));
}
