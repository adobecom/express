import fetchAllTemplatesMetadata from '../../scripts/all-templates-metadata.js';
import {
    createTag,
    fetchPlaceholders,
    getConfig,
    getMetadata,
    sampleRUM
} from '../../scripts/utils.js';


function handlelize(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/(\W+|\s+)/g, '-') // Replace space and other characters by hyphen
        .replace(/--+/g, '-') // Replaces multiple hyphens by one hyphen
        .replace(/(^-+|-+$)/g, '') // Remove extra hyphens from beginning or end of the string
        .toLowerCase(); // To lowercase
}
function cycleThroughSuggestions(block, targetIndex = 0) {
    const suggestions = block.querySelectorAll('.suggestions-list li');
    if (targetIndex >= suggestions.length || targetIndex < 0) return;
    if (suggestions.length > 0) suggestions[targetIndex].focus();
}

export function importSearchBar(block, blockMediator) {
    blockMediator.subscribe('stickySearchBar', (e) => {
        const parent = block.querySelector(
            '.api-templates-toolbar .wrapper-content-search',
        );
        if (!parent) return

        const existingStickySearchBar = parent.querySelector(
            '.search-bar-wrapper',
        );
        
        if (e.newValue.loadSearchBar && !existingStickySearchBar) {
            const searchWrapper = e.newValue.element;
            parent.prepend(searchWrapper);
            searchWrapper.classList.add('show');
            searchWrapper.classList.add('collapsed');

            const searchDropdown = searchWrapper.querySelector(
                '.search-dropdown-container',
            );
            const searchForm = searchWrapper.querySelector('.search-form');
            const searchBar = searchWrapper.querySelector('input.search-bar');
            const clearBtn = searchWrapper.querySelector('.icon-search-clear');
            const trendsContainer = searchWrapper.querySelector('.trends-container');
            const suggestionsContainer = searchWrapper.querySelector(
                '.suggestions-container',
            );
            const suggestionsList = searchWrapper.querySelector('.suggestions-list');

            searchBar.addEventListener(
                'click',
                (event) => {
                    event.stopPropagation();
                    searchWrapper.classList.remove('collapsed');
                    setTimeout(() => {
                        searchDropdown.classList.remove('hidden');
                    }, 500);
                },
                { passive: true },
            );

            searchBar.addEventListener(
                'keyup',
                () => {
                    if (searchBar.value !== '') {
                        clearBtn.style.display = 'inline-block';
                        trendsContainer.classList.add('hidden');
                        suggestionsContainer.classList.remove('hidden');
                    } else {
                        clearBtn.style.display = 'none';
                        trendsContainer.classList.remove('hidden');
                        suggestionsContainer.classList.add('hidden');
                    }
                },
                { passive: true },
            );

            searchBar.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowDown' || event.keyCode === 40) {
                    event.preventDefault();
                    cycleThroughSuggestions(block);
                }
            });

            document.addEventListener(
                'click',
                (event) => {
                    const { target } = event;
                    if (target !== searchWrapper && !searchWrapper.contains(target)) {
                        searchWrapper.classList.add('collapsed');
                        searchDropdown.classList.add('hidden');
                        searchBar.value = '';
                        suggestionsList.innerHTML = '';
                        trendsContainer.classList.remove('hidden');
                        suggestionsContainer.classList.add('hidden');
                        clearBtn.style.display = 'none';
                    }
                },
                { passive: true },
            );

            const redirectSearch = async () => {
                const placeholders = await fetchPlaceholders();
                const taskMap = placeholders['x-task-name-mapping']
                    ? JSON.parse(placeholders['task-name-mapping'])
                    : {};

                const format = getMetadata('placeholder-format');
                let currentTasks = '';
                let searchInput = searchBar.value.toLowerCase() || getMetadata('topics');

                const tasksFoundInInput = Object.entries(taskMap)
                    .filter((task) => task[1].some((word) => {
                        const searchValue = searchBar.value.toLowerCase();
                        return searchValue.indexOf(word.toLowerCase()) >= 0;
                    }))
                    .sort((a, b) => b[0].length - a[0].length);

                if (tasksFoundInInput.length > 0) {
                    tasksFoundInInput[0][1]
                        .sort((a, b) => b.length - a.length)
                        .forEach((word) => {
                            searchInput = searchInput
                                .toLowerCase()
                                .replace(word.toLowerCase(), '');
                        });

                    searchInput = searchInput.trim();
                    [[currentTasks]] = tasksFoundInInput;
                }

                const { prefix } = getConfig().locale;
                const topicUrl = searchInput ? `/${searchInput}` : '';
                const taskUrl = `/${handlelize(currentTasks.toLowerCase())}`;
                const targetPath = `${prefix}/express/templates${taskUrl}${topicUrl}`;
                const allTemplatesMetadata = await fetchAllTemplatesMetadata();
                const pathMatch = (event) => event.url === targetPath;
                if (allTemplatesMetadata.some(pathMatch)) {
                    window.location = `${window.location.origin}${targetPath}`;
                } else {
                    const searchUrlTemplate = `/express/templates/search?tasks=${currentTasks}&phformat=${format}&topics=${searchInput || "''"
                        }&q=${searchInput || "''"}`;
                    window.location = `${window.location.origin}${prefix}${searchUrlTemplate}`;
                }
            };

            const onSearchSubmit = async () => {
                searchBar.disabled = true;
                sampleRUM(
                    'search',
                    {
                        source: block.dataset.blockName,
                        target: searchBar.value,
                    },
                    1,
                );
                await redirectSearch();
            };

            const handleSubmitInteraction = async (item) => {
                if (item.query !== searchBar.value) {
                    searchBar.value = item.query;
                    searchBar.dispatchEvent(new Event('input'));
                }
                await onSearchSubmit();
            };

            searchForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                searchBar.disabled = true;
                sampleRUM(
                    'search',
                    {
                        source: block.dataset.blockName,
                        target: searchBar.value,
                    },
                    1,
                );
                await redirectSearch();
            });

            clearBtn.addEventListener(
                'click',
                () => {
                    searchBar.value = '';
                    suggestionsList.innerHTML = '';
                    trendsContainer.classList.remove('hidden');
                    suggestionsContainer.classList.add('hidden');
                    clearBtn.style.display = 'none';
                },
                { passive: true },
            );

            const suggestionsListUIUpdateCB = (suggestions) => {
                suggestionsList.innerHTML = '';
                const searchBarVal = searchBar.value.toLowerCase();
                if (
                    suggestions
                    && !(suggestions.length <= 1 && suggestions[0]?.query === searchBarVal)
                ) {
                    suggestions.forEach((item, index) => {
                        const li = createTag('li', { tabindex: 0 });
                        const valRegEx = new RegExp(searchBar.value, 'i');
                        li.innerHTML = item.query.replace(
                            valRegEx,
                            `<b>${searchBarVal}</b>`,
                        );
                        li.addEventListener('click', async () => {
                            await handleSubmitInteraction(item);
                        });

                        li.addEventListener('keydown', async (event) => {
                            if (event.key === 'Enter' || event.keyCode === 13) {
                                await handleSubmitInteraction(item);
                            }
                        });

                        li.addEventListener('keydown', (event) => {
                            if (event.key === 'ArrowDown' || event.keyCode === 40) {
                                event.preventDefault();
                                cycleThroughSuggestions(block, index + 1);
                            }
                        });

                        li.addEventListener('keydown', (event) => {
                            if (event.key === 'ArrowUp' || event.keyCode === 38) {
                                event.preventDefault();
                                cycleThroughSuggestions(block, index - 1);
                            }
                        });

                        suggestionsList.append(li);
                    });
                }
            };

            import('../../scripts/autocomplete-api-v3.js').then(
                ({ default: useInputAutocomplete }) => {
                    const { inputHandler } = useInputAutocomplete(
                        suggestionsListUIUpdateCB,
                        { throttleDelay: 300, debounceDelay: 500, limit: 7 },
                    );
                    searchBar.addEventListener('input', inputHandler);
                },
            );
        }

        if (e.newValue.loadSearchBar && existingStickySearchBar) {
            existingStickySearchBar.classList.add('show');
        }

        if (!e.newValue.loadSearchBar && existingStickySearchBar) {
            existingStickySearchBar.classList.remove('show');
        }

    });
}