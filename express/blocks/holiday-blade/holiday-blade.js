import {
    createTag,
    transformLinkToAnimation
} from '../../scripts/utils.js';
function decorateHoliday(block, props) {
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


export default function decorate (block) {
    const props = {}
    decorateHoliday(block, props)
}