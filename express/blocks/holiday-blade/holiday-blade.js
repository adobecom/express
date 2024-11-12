import {
    createTag,
    transformLinkToAnimation
} from '../../scripts/utils.js';
import buildCarousel from '../shared/carousel.js';

import {
    fetchTemplates,
    gatherPageImpression,
    isValidTemplate,
    trackSearch,
    updateImpressionCache
} from '../../scripts/template-search-api-v3.js';
import {
    createOptimizedPicture,
    fetchPlaceholders,
    getMetadata
} from '../../scripts/utils.js';
import renderTemplate from '../template-x/template-rendering.js';

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

async function fetchAndRenderTemplates(props) {
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
    return await getTemplates(response, placeholders, fallbackMsg);
}

// Originally attachFreeInAppPills function
async function attachFreeInAppPills(block) {
    const freeInAppText = await fetchPlaceholders().then((json) => json['free-in-app']);

    const templateLinks = block.querySelectorAll('a.template');
    for (const templateLink of templateLinks) {
        if (!block.classList.contains('apipowered')
            && templateLink.querySelectorAll('.icon-premium').length <= 0
            && !templateLink.classList.contains('placeholder')
            && !templateLink.querySelector('.icon-free-badge')
            && freeInAppText) {
            const $freeInAppBadge = createTag('span', { class: 'icon icon-free-badge' });
            $freeInAppBadge.textContent = freeInAppText;
            templateLink.querySelector('div').append($freeInAppBadge);
        }
    }
}

// Originally populateTemplates function
function populateTemplates(block, props, templates) {
    for (let tmplt of templates) {
        const isPlaceholder = tmplt.querySelector(':scope > div:first-of-type > img[src*=".svg"], :scope > div:first-of-type > svg');
        const linkContainer = tmplt.querySelector(':scope > div:nth-of-type(2)');
        const rowWithLinkInFirstCol = tmplt.querySelector(':scope > div:first-of-type > a');
        const innerWrapper = block.querySelector('.holiday-blade-inner-wrapper');

        if (innerWrapper && linkContainer) {
            const link = linkContainer.querySelector(':scope a');
            if (link && isPlaceholder) {
                const aTag = createTag('a', {
                    href: link.href || '#',
                });
                aTag.append(...tmplt.children);
                tmplt.remove();
                tmplt = aTag;
                // convert A to SPAN
                const newLink = createTag('span', { class: 'template-link' });
                newLink.append(link.textContent.trim());
                linkContainer.innerHTML = '';
                linkContainer.append(newLink);
            }
            innerWrapper.append(tmplt);
        }

        if (rowWithLinkInFirstCol && !tmplt.querySelector('img')) {
            props.tailButton = rowWithLinkInFirstCol;
            rowWithLinkInFirstCol.remove();
        }

        if (!tmplt.querySelectorAll(':scope > div > *').length) {
            // remove empty row
            tmplt.remove();
        }
        tmplt.classList.add('template');
        if (isPlaceholder) {
            tmplt.classList.add('placeholder');
        }
    }
}

async function decorateTemplates(block, props) {


    // Main decorateTemplates logic
    const impression = gatherPageImpression(props);
    updateImpressionCache(impression);
    const innerWrapper = block.querySelector('.holiday-blade-inner-wrapper');
    const templates = Array.from(innerWrapper.children);

    block.querySelectorAll(':scope picture > img').forEach((img) => {
        const { src, alt } = img;
        img.parentNode.replaceWith(createOptimizedPicture(src, alt, true, [{ width: '400' }]));
    });

    populateTemplates(block, props, templates);
    await attachFreeInAppPills(block);
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


export default async function decorate(block) {
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
        "orientation": "horizontal",
        "renditionParams": {
            "format": "jpg",
            "size": 151
        },
        "collectionId": collection_id,
        "limit" : 10// rows[3]?.children[1].textContent || 10,
    }

    const { templates, fallbackMsg } = await fetchAndRenderTemplates(props);

    const animation = transformLinkToAnimation(rows[0].children[1].querySelector('a'));
    block.classList.add('animated');
    block.append(animation);

    const toggleBar = rows[0].children[0]
    toggleBar.classList.add('toggle-bar')
    const toggleChev = createTag('div', { class: 'toggle-button-chev' });
    toggleBar.append(toggleChev)

    for (let i = 1; i < 4;i++) {
        rows[i].innerHTML = ''
    }
    const innerWrapper = createTag('div', { class: 'holiday-blade-inner-wrapper' })
    for (let template of templates) {
        innerWrapper.appendChild(template)
    }
    rows[1].appendChild(innerWrapper)
    decorateTemplates(block, props);
    buildCarousel(':scope > .template', innerWrapper)
    attachToggleControls(block, rows[0], toggleChev)
}