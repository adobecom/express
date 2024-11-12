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
    const onToggle = () => {
        block.classList.toggle('expanded');
    };
    const templateImages = block.querySelectorAll('.template');

    templateImages.forEach((template) => {
        template.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    toggleChev.addEventListener('click', onToggle);
    block.addEventListener('click', () => onToggle());
    document.addEventListener('click', (e) => {
        if (e.target.closest('.carousel-fader-right') || e.target.closest('.carousel-fader-left')) {
            return;
        }
        if (e.target.closest('.holiday-blade') || (
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

    // Main function logic
    const [placeholders, { response, fallbackMsg }] = await Promise.all(
        [fetchPlaceholders(), fetchTemplates(props)],
    );

    if (!response || !response.items || !Array.isArray(response.items)) {
        return { templates: null };
    }

    if ('_links' in response) {
        // eslint-disable-next-line no-underscore-dangle
        const nextQuery = response._links.next.href;
        const starts = new URLSearchParams(nextQuery).get('start').split(',');
        props.start = starts.join(',');
    } else {
        props.start = '';
    }
    props.total = response.metadata.totalHits;

    // eslint-disable-next-line no-return-await
    const { templates } = await getTemplates(response, placeholders, fallbackMsg);

    const rows = block.children;
    for (let i = 1; i < 4; i++) {
        rows[i].innerHTML = '';
    }
    const innerWrapper = createTag('div', { class: 'holiday-blade-inner-wrapper' });
    for (const template of templates) {
        innerWrapper.appendChild(template);
    }
    rows[0].classList.add('content-loaded')
 
    decorateTemplates(block,   innerWrapper);
    buildCarousel(':scope > .template', innerWrapper);
    attachToggleControls(block, rows[0], toggleChev);
    
    rows[1].appendChild(innerWrapper);
    setTimeout(() => {
        rows[1].classList.add('content-loaded')
    }, 100)
    
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
        "limit": 10 || rows[3]?.children[1].textContent,
    };
    decorateHoliday(block, props);
    updateImpressionCacheLocal(block, props);
}
