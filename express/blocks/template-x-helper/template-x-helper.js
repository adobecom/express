import { loadStyle } from '../../scripts/utils.js';
import { html, render, useReducer, useRef, useEffect } from '../../scripts/libs/htm-preact.js';
import renderTemplateX from '../template-x/template-x.js';

const initialState = {
  orientation: 'Vertical',
  width: 'sixcols',
  tasks: 'flyer',
  topics: '',
  collectionID: '',
  limit: 10,
  sort: 'Newest to Oldest',
  locales: '',
  animated: 'all',
  premium: 'false',
  q: '',
};
const reducer = (state, action) => {
  switch (action.type) {
    case 'tasks':
      return { ...state, tasks: action.payload };
    default:
      return state;
  }
};

function Form({ tasksOnInput, tasksValue }) {
  return html`
  <h4>Template X</h4>
    <form>
      <input type="text" class='header' />
      <span class='blank-label'>Blank Template</span>
      <input type="text" class='blank-image' />
      <input type="text" class='blank-link' />
      <input type="text" class='blank-ratio' />
      <span>Tasks</span>
      <input type="text" value=${tasksValue} onInput=${tasksOnInput} />
      <span>Topics</span>
      <input type="text" />
      <span>q</span>
      <input type="text" />
      <span>Collection ID</span>
      <input type="text" />
      <span>Orientation</span>
      <select>
        <option>Vertical</option>
        <option>Horizontal</option>
      </select>
      <span>Width</span>
      <select>
        <option>sixcols</option>
        <option>twelvecols</option>
      </select>
      <span>Limit</span>
      <input type="number" />
      <span>Sort</span>
      <select>
        <option>Newest to Oldest</option>
        <option>Oldest to Newest</option>
      </select>
      <span>Locales</span>
      <input type="text" />
      <span>Animated</span>
      <input type="text" />
      <span>Premium</span>
      <input type="text" />
    </form>`;
}

function buildUpTemplateXBlock({
  header,
  blankImage,
  blankLink,
  blankRatio,
  tasks,
  topics,
  collectionID,
  locales,
  orientation,
  width,
  limit,
  sort,
  animated,
  premium,
}, ref) {
  if (tasks === 'flyera') return 'aha';
  return html`
  <div class="template-x block">
    <div>
      <div>
        ${header}
      </div>
    </div>
    <div>
      <div><strong>Blank Template</strong></div>
      <div>
        ${blankImage}
      </div>
      <div>${blankLink}</div>
      <div>${blankRatio}</div>
    </div>
    <div>
      <div><strong>Tasks</strong></div>
      <div>${tasks}</div>
    </div>
    <div>
      <div><strong>Topics</strong></div>
      <div>${topics}</div>
    </div>
    <div>
      <div>
        <p><strong>Collection ID</strong></p>
      </div>
      <div>${collectionID}</div>
    </div>
    <div>
      <div>
        <p><strong>Orientation</strong></p>
      </div>
      <div>${orientation}</div>
    </div>
    <div>
      <div>
        <p><strong>Width</strong></p>
      </div>
      <div>${width}</div>
    </div>
    <div>
      <div>
        <p><strong>Limit</strong></p>
      </div>
      <div>${limit}</div>
    </div>
    <div>
      <div>
        <p><strong>Sort</strong></p>
      </div>
      <div>${sort}</div>
    </div>
    <div>
      <div><strong>Locales</strong></div>
      <div>${locales}</div>
    </div>
    <div>
      <div>
        <p><strong>Animated</strong></p>
      </div>
      <div>${animated}</div>
    </div>
    <div>
      <div>
        <p><strong>Premium</strong></p>
      </div>
      <div>${premium}</div>
    </div>
  </div>`;
}

function Container({ refContainer, refreshTemplateX, el }) {
  const templateXRef = useRef(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const { tasks } = state;
  refContainer.ref = templateXRef;
  const tasksOnInput = (e) => {
    dispatch({ type: 'tasks', payload: e.target.value });
  };
  useEffect(() => {
    setTimeout(() => {
      refreshTemplateX();
    }, 1000);
    // refreshTemplateX();
  }, [tasks]);
  const templateXBlock = buildUpTemplateXBlock(state, templateXRef);
  console.log('el in container:', el);
  return html`
    <${Form} tasksOnInput=${tasksOnInput} tasksValue=${tasks} />
    ${templateXBlock}
  `;
}
// why el not getting updated?
loadStyle('/express/blocks/template-x/template-x.css');
export default async function init(el) {
  const refContainer = {};
  const refreshTemplateX = () => {
    // renderTemplateX(refContainer.ref.current);
    console.log('refreshCB:', { el, elChildren: el.Container });
    renderTemplateX(el.querySelector('.template-x'));
  };
  render(html`<${Container} refContainer=${refContainer} refreshTemplateX=${refreshTemplateX} el=${el}/>`, el);
  // renderTemplateX(el.querySelector('.template-x'));
}
