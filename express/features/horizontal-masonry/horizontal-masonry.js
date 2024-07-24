import { createTag } from '../../scripts/utils.js'

const enticementHTML = `<div class="input-container">
<span class="try-it-text">Try it</span>
<img src="path-to-curved-arrow.png" alt="Curved arrow" class="curved-arrow">
<input type="text" placeholder="Describe the image you want to create...">
<button class="generate-small-btn">Generate</button>
</div>
`

export default async function setHorizontalMasonry(el) {

  const args = el.querySelectorAll('.interactive-container > .asset > p')
  const container = el.querySelector('.interactive-container .asset')
  container.classList.add('media-container')
  console.log(args)

  const enticementMode = el.classList.contains('light') ? 'light' : 'dark'; 
  const enticementText = args[0].textContent.trim();
  const enticementIcon = args[0].href; 
  args[0].remove()

  const enticementDiv = createTag('div')
  enticementDiv.innerHTML = enticementHTML
  el.querySelector('.interactive-container').appendChild(enticementDiv)
  for (let i = 1; i < args.length; i += 4) {
    let divider = args[i]
    divider.remove()
    let link = args[i + 1]
    link.classList.add('link')
    let prompt = args[i + 2]
    prompt.classList.add("overlay")
    let image = args[i + 3]
    image.classList.add('image-container')
    image.appendChild(prompt)
    image.appendChild(link)
  }
}