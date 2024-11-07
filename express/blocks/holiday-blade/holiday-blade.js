import {
    createTag,
    transformLinkToAnimation
} from '../../scripts/utils.js';
import buildCarousel from '../shared/carousel.js';
import { fetchAndRenderTemplates, decorateTemplates } from '../template-x/template-x.js';

async function decorateHoliday(block, templates, props) {
    const rows = block.children
    const animation = transformLinkToAnimation(rows[0].children[1].querySelector('a'));
    block.classList.add('animated');
    block.append(animation);

    const toggleBar = rows[0].children[0]
    toggleBar.children[0].classList.add('toggle-bar')
    const toggleChev = createTag('div', { class: 'toggle-button-chev' });
    console.log(toggleChev)
    toggleBar.append(toggleChev)

    toggleChev.addEventListener('click', () => {
        if (block.classList.contains('expanded')) {
            block.classList.remove('expanded')
        } else {
            block.classList.add('expanded')
        }
    })

    rows[1].innerHTML = ''
    rows[2].innerHTML = ''
    const innerWrapper = createTag('div', {class : 'template-x-inner-wrapper'})
    for (let template of templates) {
        innerWrapper.appendChild(template)
    }
    rows[1].appendChild(innerWrapper)
    await decorateTemplates(block, props);
    buildCarousel(':scope > .template',innerWrapper)
    console.log(rows[1])

}


function initExpandCollapseToolbar(block, templateTitle, toggle, toggleChev) {
    const onToggle = () => {
        block.classList.toggle('expanded');

        if (document.body.dataset.device === 'mobile' || block.classList.contains('mobile')) {
            const tglBtn = block.querySelector('.toggle-button');
            const heading = templateTitle.querySelector('.toggle-bar-top > h4');

            if (tglBtn && heading) {
                const rect = heading.getBoundingClientRect();
                if (!block.classList.contains('expanded')) {
                    tglBtn.style.marginLeft = `${rect.x}px`;
                } else {
                    tglBtn.style.removeProperty('margin-left');
                }
            }
        }
    };
    const templateImages = block.querySelectorAll('.template');

    templateImages.forEach((template) => {
        template.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    toggleChev.addEventListener('click', onToggle);
    toggle.addEventListener('click', () => onToggle());
    document.addEventListener('click', (e) => {
        if (e.target.closest('.carousel-fader-right') || e.target.closest('.carousel-fader-left')) {
            return;
        }
        if (e.target.closest('.template-x.holiday') || (
            block.classList.contains('expanded')
        )) {
            onToggle();
        }
    });

    setTimeout(() => {
        if (block.classList.contains('auto-expand')) {
            onToggle();
        }
    }, 3000);
}


export default async function decorate (block) {
    const rows = block.children
    
    const locale = rows[1].children[1].textContent
    const collection_id = rows[2].children[1].textContent
    const props = {
        "templates": [],
        "filters": {
            "locales": locale,
            "topics": "",
            "behaviors": "still",
            "premium": "False"
        },
        "orientation" : "horizontal",
        "renditionParams": {
            "format": "jpg",
            "size": 151
        }, 
        "collectionId": collection_id,
    }
    console.log(props)
    const { templates, fallbackMsg } = await fetchAndRenderTemplates(props);
    decorateHoliday(block, templates, props)
}