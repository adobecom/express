import { html, render } from '../../scripts/libs/htm-preact.js';
import Game from './ttt/ttt.js';
import Temperature from './temperature/temperature.js';

export default async function init(el) {
  el.querySelector('div').remove();
  const ttt = html`
    <${Game} />
  `;
  const temperature = html`
    <${Temperature} />
  `;
  const tttDiv = document.createElement('div');
  const temperatureDiv = document.createElement('div');
  render(ttt, tttDiv);
  render(temperature, temperatureDiv);
  el.append(tttDiv);
  el.append(temperatureDiv);
}
