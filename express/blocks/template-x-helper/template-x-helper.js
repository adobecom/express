import { createTag, loadScript } from '../../scripts/utils.js';
import { html, render, useReducer } from '../../scripts/libs/htm-preact.js';
import renderTemplateX from '../template-x/template-x.js';

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
