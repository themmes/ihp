import debounce from 'https://cdn.skypack.dev/underscore/modules/debounce';
import { createState, createEffect } from 'https://cdn.skypack.dev/solid-js';
import { render } from 'https://cdn.skypack.dev/solid-js/web';
import html from 'https://cdn.skypack.dev/solid-js/html';

async function queryAPI(query) {
    const searchAttributes = [
        'in:file',
        'language:Markdown',
        'extension:markdown',
        'repo:digitallyinduced/ihp',
        'path:Guide/',
    ].join('+');

    const searchURL = `https://api.github.com/search/code?q=${query}+${searchAttributes}`;

    return fetch(searchURL).then((r) => r.json());
}

const App = () => {
    const navLinkElements = Array.from(document.querySelectorAll('.nav-link'));

    const [state, setState] = createState({
        searchQuery: '',
        searchResults: [],
    });

    // Debounce Update Of `searchQuery` State After 0.5 Seconds
    const setSearchQuery = debounce(
        (query) => setState('searchQuery', query),
        400
    );

    // Query GitHub API Once `searchQuery` State Has Changed
    createEffect(async () => {
        if (!state.searchQuery) {
            showAllLinks();
            return;
        }

        const queryResult = await queryAPI(state.searchQuery);
        setState('searchResults', queryResult.items);

        const fileNames = state.searchResults.map((searchResult) =>
            searchResult.name.replace('.markdown', '.html')
        );

        navLinkElements.forEach((element) => {
            try {
                const { path } = String(element.pathname).match(
                    /(?<path>[\w|\-]+\.html$)/
                ).groups;

                // Hide/Show links that don't include search result
                if (!fileNames.includes(path)) {
                    element.style.display = 'none';
                } else {
                    element.style.display = 'block';
                }
            } catch (error) {
                // The `element.pathname` is some other link that we don't care about.
                return;
            }
        });
    });

    function showAllLinks() {
        navLinkElements.forEach((element) => (element.style.display = 'block'));
    }

    return html`
        <style>
            #guide-search {
                color: #073642;
                margin: 20px 0;
                display: flex;
                align-items: center;
                justify-content: flex-end;
            }
        </style>

        <input
            type="text"
            id="guide-search-input"
            name="guide-search-input"
            placeholder="Search Guide"
            autocomplete="off"
            oninput=${(event) => setSearchQuery(event.target.value)}
        />
    `;
};

render(App, document.querySelector('#guide-search'));
