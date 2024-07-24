import { createTag } from '../../scripts/utils.js'

function createEnticement (enticementDetail,enticementIcon, mode) { 
  const enticementDiv = createTag('div', { class: 'enticement-container' });
  const svgImage = createTag('img', { class: 'enticement-arrow', alt: '' });
  let arrowText = enticementDetail
  svgImage.src = enticementIcon 
  const enticementText = createTag('span', { class: 'enticement-text' }, arrowText.trim());
  const input = createTag('input', {type : 'text', placeholder: "Describe the image you want to create..."})
  const button = createTag('button', {class : 'generate-small-btn' })
  button.textContent = 'Generate'
  enticementDiv.append(enticementText, svgImage, input, button);
  if (mode === 'light') enticementText.classList.add('light');
  return enticementDiv;
}

export default async function setHorizontalMasonry(el) {

  const args = el.querySelectorAll('.interactive-container > .asset > p')
  const container = el.querySelector('.interactive-container .asset')
  container.classList.add('media-container')

  const enticementElement = args[0].querySelector('a')
  const enticementMode = el.classList.contains('light') ? 'light' : 'dark'; 
  const enticementText = enticementElement.textContent.trim();
  const enticementIcon = enticementElement.href; 
  console.log(enticementText, enticementIcon, enticementElement)
  args[0].remove()

  el.querySelector('.interactive-container').appendChild(createEnticement(enticementText, enticementIcon, enticementMode))
  for (let i = 1; i < args.length; i += 4) {
    let divider = args[i]
    divider.remove()
    let link = args[i + 1]
    link.classList.add('link')
    let prompt = args[i + 2]
    prompt.classList.add("overlay")
    const title = createTag('div', {class : 'prompt-title'})
    title.textContent = "Prompt used"
    prompt.prepend(title)
    let image = args[i + 3]
    image.classList.add('image-container')
    image.appendChild(prompt)
    image.appendChild(link)
  }
}