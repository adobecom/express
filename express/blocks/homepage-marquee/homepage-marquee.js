import {
    createTag,
    toClassName,
    addHeaderSizing,
    getIconElement,
    fetchPlaceholders,
    getConfig,
    getMetadata,
    transformLinkToAnimation,
  } from '../../scripts/utils.js';

const LOGO = 'adobe-express-logo';
const LOGO_WHITE = 'adobe-express-logo-white';

function injectExpressLogo(block, wrapper) {
    if (block.classList.contains('entitled')) return;
    // if (!['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase())) return;
    const mediaQuery = window.matchMedia('(min-width: 900px)');
    const logo = getIconElement(block.classList.contains('dark') && mediaQuery.matches ? LOGO_WHITE : LOGO,24);
    mediaQuery.addEventListener('change', (e) => {
      if (!block.classList.contains('dark')) return;
      if (e.matches) {
        logo.src = logo.src.replace(`${LOGO}.svg`, `${LOGO_WHITE}.svg`);
        logo.alt = logo.alt.replace(LOGO, LOGO_WHITE);
      } else {
        logo.src = logo.src.replace(`${LOGO_WHITE}.svg`, `${LOGO}.svg`);
        logo.alt = logo.alt.replace(LOGO_WHITE, LOGO);
      }
    });
    logo.classList.add('express-logo');
    if (wrapper.firstElementChild?.tagName === 'H2') {
      logo.classList.add('eyebrow-margin');
    }
    logo.style.width = '24px'
    logo.style.heiight = '24px'
    wrapper.prepend(logo);
  }


function transformLinkToVideo (media) { 
    const attributes = { class: 'hero-animation-background' };
    ['playsinline', 'autoplay', 'loop', 'muted'].forEach((p) => {
      attributes[p] = '';
    });
    const updatedMedia = createTag('video', attributes);
    updatedMedia.src = media.href;
    return updatedMedia
}

export default function decorate(block) {
    console.log('abc')
    block.children[0].classList.add('header')
    for (let i = 1; i < 5;i++) {
        block.children[i].classList.add('card')
        block.children[i].children[0].classList.add('main-card-display')
        block.children[i].children[0].children[1].classList.add('main-card-title')
        const links = block.children[i].children[0].querySelectorAll('a')
        const videoLink = links[links.length - 1]
        console.log(videoLink)
        for (let j = 1; j <  block.children[i].children.length; j++){
            block.children[i].children[j].classList.add('main-card-tray')
            const links = block.children[i].children[j].querySelectorAll('p')
            for (let k = 0; k < links.length;k++) {
                const wrapper = createTag('div', { class : 'icon-wrapper'})
                const icon = createTag('img', {
                    src :    window.location.origin +"/express/icons/" +   links[k].textContent.split(" ")[0] + ".svg",
                    width: '20px',
                    heiight: '20px'
                })
                const link = links[k].children[0]
                wrapper.append(icon,link)
                links[k].remove()
                block.children[i].children[j].appendChild(wrapper)
                
            }
     
       
            
            if (videoLink) {
                block.children[i].children[j].prepend(transformLinkToAnimation(videoLink))
                videoLink.remove()
            }

            const p = createTag('p')
            p.textContent = block.children[i].querySelector(".main-card-title").textContent
            block.children[i].children[j].prepend(p)

        }
    }
    injectExpressLogo(block, block.children[0])
}