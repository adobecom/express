import {
    createTag,
    transformLinkToAnimation,
    createOptimizedPicture,
    fetchPlaceholders,
} from '../../scripts/utils.js';
import buildCarousel from '../shared/carousel.js';

import {
    fetchTemplates,
    gatherPageImpression,
    isValidTemplate,
    trackSearch,
    updateImpressionCache
} from '../../scripts/template-search-api-v3.js';

import renderTemplate from '../template-x/template-rendering.js';

async function decorateHoliday(block, props) {
    const rows = block.children;
    const toggleBar = rows[0].children[0];
    toggleBar.classList.add('toggle-bar');
    const toggleChev = createTag('div', { class: 'toggle-button-chev' });
    toggleBar.append(toggleChev);
    const animation = transformLinkToAnimation(rows[0].children[1].querySelector('a'));
    block.classList.add('animated');
    block.append(animation);
    fetchAndRenderTemplates(block, props, toggleChev);
}

function attachToggleControls(block, toggleChev) {

    const onToggle = (e) => {
        e.stopPropagation()
        if (e.target.closest('.carousel-fader-right') || e.target.closest('.carousel-fader-left') || e.target.closest('.carousel-container')) {

            return;
        }
        block.classList.toggle('expanded')
    };

    const onOutsideToggle = (e) => {
        e.stopPropagation()
        if (e.target.closest('.carousel-fader-right') || e.target.closest('.carousel-fader-left') || e.target.closest('.carousel-container')) {

            return;
        }
        if (
            block.classList.contains('expanded')
        ) {
            block.classList.toggle('expanded')
        }
    };
    const templateImages = block.querySelectorAll('.template');

    templateImages.forEach((template) => {
        template.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    toggleChev.addEventListener('click', onToggle);
    block.querySelector('.toggle-bar').addEventListener('click', onToggle);
    document.addEventListener('click', onOutsideToggle);

    setTimeout(() => {
        if (block.classList.contains('auto-expand')) {
            onToggle();
        }
    }, 3000);
}

function loadTemplatesPromise(props, block, innerWrapper, placeholders, getTemplates, start) {
    return new Promise(async (resolve, reject) => {
        try {
            // Add loading state
            innerWrapper.classList.add('loading-templates');

            // Fetch templates
            const { response, fallbackMsg } = await fetchTemplates({
                ...props, start
            });

            // Validate response
            if (!response || !response.items || !Array.isArray(response.items)) {
                throw new Error('Invalid template response format');
            }

            // Get and process templates
            const { templates } = await getTemplates(response, placeholders, fallbackMsg);

            // Batch DOM updates
            const fragment = document.createDocumentFragment();
            templates.forEach(template => {
                fragment.appendChild(template);
            });

            // Update DOM once
            innerWrapper.appendChild(fragment);

            // Decorate templates
            await decorateTemplates(block, innerWrapper);

            // Remove loading state
            innerWrapper.classList.remove('loading-templates');

            resolve({ templates, response });

        } catch (error) {
            innerWrapper.classList.remove('loading-templates');
            innerWrapper.classList.add('templates-error');
            reject(error);
        }
    });
}


async function fetchAndRenderTemplates(block, props, toggleChev) {
    // Original getTemplates function logic
    async function getTemplates(response, phs, fallbackMsg) {
        const filtered = response.items.filter((item) => isValidTemplate(item));
        const templates = await Promise.all(
            filtered.map((template) => renderTemplate(template, phs)),
        );
        return {
            fallbackMsg,
            templates,
        };
    }

    const rows = block.children;
    for (let i = 1; i < 4; i++) {
        rows[i].innerHTML = '';
    }
    const innerWrapper = createTag('div', { class: 'holiday-blade-inner-wrapper' });
    const placeholders = await fetchPlaceholders()
    const p = []
    for (let i = 0; i < props.total_limit / 5; i++) {

        // p.push(async (props) => {
        //     const { response, fallbackMsg } = await fetchTemplates(props)
        //     if (!response || !response.items || !Array.isArray(response.items)) {
        //         return;
        //     }
        //     const { templates } = await getTemplates(response, placeholders, fallbackMsg);
        //     for (const template of templates) {
        //         innerWrapper.appendChild(template);
        //     }
        //     console.log(templates)
        //     props.start += 5
        //     decorateTemplates(block, innerWrapper);
        // })
        p.push(loadTemplatesPromise(props,block,innerWrapper,placeholders, getTemplates, i * 5))
    }
    rows[0].classList.add('content-loaded')
    await p[0]
    p.splice(0,1)
    buildCarousel(':scope > .template', innerWrapper);
    rows[1].appendChild(innerWrapper);
    attachToggleControls(block, toggleChev);
    setTimeout(() => {
        rows[1].classList.add('content-loaded')
    }, 100)

    Promise.all(p)
    

    // eslint-disable-next-line no-return-await


   
   
   
 
}

function decorateTemplates(block, innerWrapper) {
    const templates = innerWrapper.children
    innerWrapper.querySelectorAll(':scope picture > img').forEach((img) => {
        const { src, alt } = img;
        img.parentNode.replaceWith(createOptimizedPicture(src, alt, true, [{ width: '400' }]));
    });

    for (const tmplt of templates) {
        tmplt.classList.add('template');
    }

}

async function updateImpressionCacheLocal(block, props) {
    const { getMetadata } = await import('../../scripts/utils.js');

    const impression = gatherPageImpression(props);
    updateImpressionCache(impression);
    const searchId = new URLSearchParams(window.location.search).get('searchId');
    updateImpressionCache({
        search_keyword: getMetadata('q') || getMetadata('topics-x') || getMetadata('topics'),
        result_count: props.total,
        content_category: 'templates',
    });
    if (searchId) trackSearch('view-search-result', searchId);

    const templateLinks = block.querySelectorAll('.template .button-container > a, a.template.placeholder');
    templateLinks.isSearchOverride = true;
    const linksPopulated = new CustomEvent('linkspopulated', { detail: templateLinks });
    document.dispatchEvent(linksPopulated);
}

export default function decorate(block) {
    const rows = block.children;
    const toggleBar = rows[0].children[0];

    toggleBar.classList.add('toggle-bar');
    const locale = rows[1].children[1].textContent;
    const collection_id = rows[2].children[1].textContent;
    const props = {
        "templates": [],
        "filters": {
            "locales": locale,
            "topics": '',
            "behaviors": 'still',
            "premium": 'False'
        },
        "orientation": 'horizontal',
        "renditionParams": {
            "format": 'jpg',
            "size": 151,
        },
        "collectionId": collection_id,
        "total_limit" : rows[3]?.children[1].textContent,
        "limit": 5
    };
    decorateHoliday(block, props);
    updateImpressionCacheLocal(block, props);
}
