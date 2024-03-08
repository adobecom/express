import { createTag } from '../../utils/utils.js';
import { html, render } from '../../deps/htm-preact.js';
import Game from './ttt.js';
import Temperature from './temperature.js';

export default async function init(el) {
  const img = el.querySelector('img');
  img.width = 600;
  img.height = 300;
  const demoContainer = createTag('div', { class: 'demo-container' });
  const ttt = html`
    <${Game} />
  `;
  const temperature = html`
    <${Temperature} />
  `;
  const tttDiv = createTag('div');
  const temperatureDiv = createTag('div');
  render(ttt, tttDiv);
  render(temperature, temperatureDiv);
  demoContainer.append(tttDiv);
  demoContainer.append(temperatureDiv);
  el.append(demoContainer);
}
