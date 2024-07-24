export default async function setHorizontalMasonry (el){
 
    const args = el.querySelectorAll('.interactive-container > .asset > p')
    const container = el.querySelector('.interactive-container .asset')
    container.classList.add('media-container') 
    console.log(args)  

    const enticementMode = el.classList.contains('light') ? 'light' : 'dark';
    const { createSelectorTray, createEnticement, createPromptField } = await import('../interactive-elements/interactive-elements.js');
    const enticementText = args[0].textContent.trim();
    const enticementIcon = args[0].href;
    const enticementDiv = await createEnticement(`${enticementText}|${enticementIcon}`, enticementMode);
    args[0].remove()
    el.querySelector('.interactive-container').appendChild(enticementDiv)
    for (let i = 1; i < args.length;i += 4){
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