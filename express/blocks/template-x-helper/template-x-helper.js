import { createTag, loadScript } from '../../scripts/utils.js';
import { html, render, useReducer } from '../../scripts/libs/htm-preact.js';
import renderTemplateX from '../template-x/template-x.js';

const initialState = {
  text: 'where you can have some text',
  blank_tepmlate: 'an image',
  orientation: 'Vertical',
  width: 'sixcols',
  tasks: '',
  topics: '',
  collectionID: '',
  limit: 10,
  sort: 'Newest to Oldest',
  locales: '',
  animated: 'all',
  premium: 'false',
  q: '',
};
const reducer = {

};

function Container() {
  return html`
  <textarea></textarea>
    <div>Nice!<//>
    <button>Paste</button>
  `;
}

export default async function init(el) {
  render(html`<${Container} />`, el);
}
