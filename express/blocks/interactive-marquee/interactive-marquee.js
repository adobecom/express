import {
  createTag, getIconElement, fetchPlaceholders, getMetadata,
} from '../../scripts/utils.js';
// [headingSize, bodySize, detailSize, titlesize]
const typeSizes = ['xxl', 'xl', 'l', 'xs'];

function decorateText(el) {
  const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const heading = headings[headings.length - 1];
  const config = typeSizes;
  const decorate = (headingEl, typeSize) => {
    headingEl.classList.add(`heading-${typeSize[0]}`);
    const bodyEl = headingEl.nextElementSibling;
    bodyEl?.classList.add(`body-${typeSize[1]}`);
    bodyEl?.nextElementSibling?.classList.add(`body-${typeSize[1]}`);
  };
  decorate(heading, config);
}

function extendButtonsClass(text) {
  const buttons = text.querySelectorAll('.con-button');
  if (buttons.length === 0) return;
  buttons.forEach((button) => {
    button.classList.add('button-justified-mobile');
  });
}

function interactiveInit(el) {
  const isLight = el.classList.contains('light');
  if (!isLight) el.classList.add('dark');
  const children = el.querySelectorAll(':scope > div');
  const foreground = children[children.length - 1];
  foreground.classList.add('foreground', 'container');
  const headline = foreground.querySelector('h1, h2, h3, h4, h5, h6');
  const text = headline.closest('div');
  text.classList.add('text');
  const mediaElements = foreground.querySelectorAll(':scope > div:not([class])');
  const media = mediaElements[0];
  if (media) {
    const interactiveBox = createTag('div', { class: 'interactive-container' });
    mediaElements.forEach((mediaDiv) => {
      mediaDiv.classList.add('asset');
      interactiveBox.appendChild(mediaDiv);
    });
    foreground.appendChild(interactiveBox);
  }

  const firstDivInForeground = foreground.querySelector(':scope > div');
  if (firstDivInForeground?.classList.contains('asset')) el.classList.add('row-reversed');
  extendButtonsClass(text);
}

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

function createEnticement(enticementDetail, enticementLink, mode, placeholders) {
  const enticementDiv = createTag('div', { class: 'enticement-container' });
  const svgImage = getIconElement('enticement-arrow', 60);
  const arrowText = enticementDetail;
  const enticementText = createTag('span', { class: 'enticement-text' }, arrowText.trim());
  const mobilePlacehoderText = (placeholders && placeholders['describe-image-mobile'])
    || 'Describe your image...';
  const desktopPlaceholderText = (placeholders && placeholders['describe-image-desktop'])
    || 'Describe the image you want to create...';
  const input = createTag('input', { type: 'text', placeholder: window.screen.width < 600 ? mobilePlacehoderText : desktopPlaceholderText });
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

async function setHorizontalMasonry(el) {
  const placeholders = await fetchPlaceholders();
  const link = el.querySelector(':scope .foreground>.text>.button-container a');
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
  args[0].remove();

  el.querySelector('.interactive-container').appendChild(createEnticement(enticementText, enticementLink, enticementMode, placeholders));
  for (let i = 1; i < args.length; i += 3) {
    const divider = args[i];
    divider.remove();
    const prompt = args[i + 1];
    prompt.classList.add('overlay');

    const image = args[i + 2];
    image.classList.add('image-container');
    image.appendChild(prompt);
    image.appendChild(createPromptLinkElement(link.href, prompt.textContent, placeholders));

    const title = createTag('div', { class: 'prompt-title' });
    title.textContent = (placeholders && placeholders['prompt-title']) || 'Prompt used';
    prompt.prepend(title);
  }
  injectExpressLogo(el, el.querySelector('.foreground > .text'));
}

export default async function init(el) {
  if (!el.classList.contains('horizontal-masonry')) {
    window.lana?.log('Using interactive-marquee on Express requires using the horizontal-masonry class.');
    return;
  }
  interactiveInit(el, createTag);
  decorateText(el);
  setHorizontalMasonry(el);
}
