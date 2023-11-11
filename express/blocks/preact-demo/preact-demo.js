import { html, render } from '../../scripts/libs/htm-preact.js';
import Game from './ttt/ttt.js';
import Temperature from './temperature/temperature.js';

export default async function init(el) {
  const ttt = html`
    <h1>Hello, Folks!</h1>
    <${Game} />
  `;
  const temperature = html`
    <${Temperature} />
  `;
  const container = document.createElement('div');
  el.append(container);
  container.classList.add('demo-container');
  const tttDiv = document.createElement('div');
  const temperatureDiv = document.createElement('div');
  render(ttt, tttDiv);
  render(temperature, temperatureDiv);
  container.append(tttDiv);
  container.append(temperatureDiv);
}
