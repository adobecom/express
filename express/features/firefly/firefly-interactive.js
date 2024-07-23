import { getLibs } from '../../scripts/utils.js';
import { defineDeviceByScreenSize } from '../../scripts/decorate.js';

export function focusOnInput(media, createTag, inputfield = null) {
  const input = inputfield === null ? media.querySelector('.prompt-text') : inputfield;
  if (!input) return;
  const device = defineDeviceByScreenSize();
  const blinkingCursor = createTag('div', { class: 'blinking-cursor' });
  if (input.classList.contains('light')) blinkingCursor.classList.add('blink-light');
  if (device === 'MOBILE' || device === 'TABLET') {
    input.insertAdjacentElement('beforebegin', blinkingCursor);
  } else input.focus();
  input.addEventListener('focusout', () => {
    if (document.querySelector('.locale-modal-v2') && device === 'DESKTOP') {
      input.insertAdjacentElement('beforebegin', blinkingCursor);
    }
  }, { once: true });
  input.addEventListener('click', () => { document.querySelector('.blinking-cursor')?.remove(); });
}

function eventOnGenerate(generateButton, media, fireflyfeature = '') {
  const btnConfigs = {
    TextToImage: ['SubmitTextToImage', 'SubmitTextToImageUserContent', 'goToFirefly'],
    TextEffects: ['SubmitTextEffects', 'SubmitTextEffectsUserContent', 'goToFireflyEffects'],
  };
  generateButton.addEventListener('click', async (e) => {
    const userprompt = media.querySelector('.prompt-text')?.value;
    const placeholderprompt = media.querySelector('.prompt-text')?.getAttribute('placeholder');
    const prompt = userprompt || placeholderprompt;
    let className = '';
    if (fireflyfeature === '') {
      const selected = media.querySelector('.selected');
      className = selected.getAttribute('class').split(' ')[1].trim();
    } else className = fireflyfeature;
    if (Object.keys(btnConfigs).includes(className)) {
      const btnConfig = btnConfigs[className];
      const dall = userprompt === '' ? btnConfig[0] : btnConfig[1];
      e.target.setAttribute('daa-ll', dall);
      const { default: signIn } = await import('./firefly-susi.js');
      signIn(prompt, btnConfig[2]);
    }
  });
}

function createGenFillPrompt(element, createTag) {
  const genfillPrompt = createTag('div', { class: 'genfill-prompt' });
  const promptConfig = element?.split('|')[0].split('[');
  const prompt = createTag('p', '', `${promptConfig[0]}`);
  const promptText = createTag('p', { class: 'genfill-promptused' }, `${promptConfig[1].replaceAll(']', '').trim()}`);
  genfillPrompt.append(prompt, promptText);
  return genfillPrompt;
}

function hideRemoveElements(option, media, mediaP) {
  media.querySelector('#promptbar')?.remove();
  media.querySelector('.genfill-prompt')?.remove();
  console.log(media)
  const selector = media.querySelector('.firefly-selectortray');
  let i = 0;
  [...selector.childNodes].forEach((el) => {
    if (el.getAttribute('class') === option.getAttribute('class')) {
      el.querySelector('img').classList.add('svgselected');
      el.classList.add('selected');
      mediaP[i].classList.remove('hide');
    } else {
      console.log(i, media, media.length, mediaP)
      el.classList.remove('selected');
      el.querySelector('img').classList.remove('svgselected');
      mediaP[i].classList.add('hide');
    }
    i += 1;
  });
}

async function eventOnSelectorOption(option, prompt, media, mediaP, createPromptField, createTag) {
  hideRemoveElements(option, media, mediaP);
  const promptText = prompt.promptpos.split('|');
  if (option.classList.contains('GenerativeFill')) {
    const genfilprompt = await createPromptField(`${promptText[0]}`, `${promptText[1]}`, prompt.promptmode, 'SubmitGenerativeFill');
    media.appendChild(genfilprompt);
    genfilprompt.classList.add('genfill-promptbar');
    const genFillButton = media.querySelector('#genfill');
    genFillButton.addEventListener('click', async () => {
      const { default: signIn } = await import('./firefly-susi.js');
      signIn('', 'goToFireflyGenFill');
    });
  } else {
    const promptBar = await createPromptField(`${promptText[0]}`, `${promptText[1]}`, prompt.promptmode);
    media.appendChild(promptBar);
    promptBar.classList.add('firefly-prompt');
    const generateButton = media.querySelector('#promptbutton');
    eventOnGenerate(generateButton, media);
    focusOnInput(media, createTag);
  }
}

async function singleFireflyFeature(promptDet, mode, createPromptField, media, feature, createTag) {
  const firstOptionDetail = promptDet.innerText.split('|');
  const fireflyPrompt = await createPromptField(`${firstOptionDetail[0]}`, `${firstOptionDetail[1]}`, mode);
  fireflyPrompt.classList.add('firefly-prompt');
  media.appendChild(fireflyPrompt);
  const generateButton = media.querySelector('#promptbutton');
  eventOnGenerate(generateButton, media, feature);
  focusOnInput(media, createTag);
}

export default async function setInteractiveFirefly(el) {
  const enticementMode = el.classList.contains('light') ? 'light' : 'dark';
  const interactiveElemMode = el.classList.contains('light') ? 'dark' : 'light';
  const buttons = el.querySelectorAll('.con-button');
  [...buttons].forEach((button) => { if (button.innerText.includes('Firefly')) button.setAttribute('daa-ll', 'getfirefly'); });
  const media = el.querySelector('.asset');
  const allP = media.querySelectorAll('p:not(:empty)');
  const allAnchorTag = media.querySelectorAll('a');
  // Get InteractiveSelection Value
  const selections = [];
  const ttiDetail = {};
  const genfDetail = {};
  const teDetail = {};
  const fireflyDomain = [
    'firefly.adobe.com',
  ];
  const allSelections = [...media.querySelectorAll('p:not(:empty)')].filter((p) => p.innerText.trim().toLowerCase().includes(fireflyDomain[0]));
  allSelections.forEach((s) => {
    const optionPromptMode = interactiveElemMode;
    const selectorValues = s.innerText.split('|');
    let selectorOption = '';
    if (selectorValues[0].includes('generate/images')) {
      ttiDetail.promptmode = optionPromptMode;
      ttiDetail.promptpos = s.nextElementSibling.innerText;
      selectorOption = 'TextToImage';
    } else if (selectorValues[0].includes('upload/inpaint')) {
      genfDetail.promptmode = 'genfill';
      genfDetail.promptpos = s.nextElementSibling.innerText;
      selectorOption = 'GenerativeFill';
    } else if (selectorValues[0].includes('generate/font-styles')) {
      teDetail.promptmode = optionPromptMode;
      teDetail.promptpos = s.nextElementSibling.innerText;
      selectorOption = 'TextEffects';
    }
    const option = {
      id: `${selectorOption}`,
      text: `${s.querySelectorAll('a')[1].textContent.trim()}`,
      svg: `${s.querySelectorAll('a')[1].href}`,
      analytics: `Select${selectorOption}`,
    };
    selections.push(option);
  });

  

  [...allP].forEach((s) => { if (!s.querySelector('picture') && !s.querySelector('video')) s.remove(); });
  const mediaP = media.querySelectorAll('p:not(:empty)');
  [...mediaP].forEach((image) => { image.classList.add('hide'); });
 
  const { createSelectorTray, createEnticement, createPromptField } = await import('../interactive-elements/interactive-elements.js');
  // Set Enticement
  console.log('--------')
  console.log(allAnchorTag[0])
  const enticementText = allAnchorTag[0].textContent.trim();
  const enticementIcon = allAnchorTag[0].href;
  const enticementDiv = await createEnticement(`${enticementText}|${enticementIcon}`, enticementMode);
  media.appendChild(enticementDiv, media.firstChild);
  const { createTag } = await import(`${getLibs()}/utils/utils.js`);
  if (el.classList.contains('ff-text-effects')) {
    mediaP[0].classList.remove('hide');
    singleFireflyFeature(allP[2], interactiveElemMode, createPromptField, media, 'TextEffects', createTag);
    return;
  }
  if (el.classList.contains('ff-text-to-image')) {
    mediaP[0].classList.remove('hide');
    singleFireflyFeature(allP[2], interactiveElemMode, createPromptField, media, 'TextToImage', createTag);
    return;
  }
  console.log(selections)
  const fireflyOptions = await createSelectorTray(selections, interactiveElemMode);
  fireflyOptions.classList.add('firefly-selectortray');
  if (selections.length === 3) fireflyOptions.classList.add('three-options');
  media.append(fireflyOptions);
  const ttiOption = media.querySelector('.TextToImage');
  const genFillOption = media.querySelector('.GenerativeFill');
  const teOption = media.querySelector('.TextEffects');
  const firstOption = media.querySelector('.selector-tray > button');
  hideRemoveElements(firstOption, media, mediaP);

  // Create prompt field for first option on page load
  const firstOptionDetail = allP[3].innerText.split('|');
  const mode = firstOption.classList.contains('GenerativeFill') ? 'genfill' : interactiveElemMode;
  const fireflyPrompt = await createPromptField(`${firstOptionDetail[0]}`, `${firstOptionDetail[1]}`, mode);
  if (firstOption.classList.contains('TextToImage') || firstOption.classList.contains('TextEffects')) {
    fireflyPrompt.classList.add('firefly-prompt');
    media.appendChild(fireflyPrompt);
    const generateButton = media.querySelector('#promptbutton');
    eventOnGenerate(generateButton, media);
  } else if (firstOption.classList.contains('GenerativeFill')) {
    fireflyPrompt.classList.add('genfill-promptbar');
    const genfillPrompt = createGenFillPrompt(genfDetail.promptpos, createTag);
    media.append(genfillPrompt, fireflyPrompt);
    const genFillButton = media.querySelector('#genfill');
    genFillButton.addEventListener('click', async () => {
      const { default: signIn } = await import('./firefly-susi.js');
      signIn('', 'goToFireflyGenFill');
    });
  }
  focusOnInput(media, createTag);
  /* Handle action on click of each firefly option button */
  ttiOption?.addEventListener('click', () => {
    eventOnSelectorOption(ttiOption, ttiDetail, media, mediaP, createPromptField, createTag);
  });
  genFillOption?.addEventListener('click', () => {
    eventOnSelectorOption(genFillOption, genfDetail, media, mediaP, createPromptField);
    const genfillPrompt = createGenFillPrompt(genfDetail.promptpos, createTag);
    media.appendChild(genfillPrompt);
  });
  teOption?.addEventListener('click', () => {
    eventOnSelectorOption(teOption, teDetail, media, mediaP, createPromptField, createTag);
  });
}
