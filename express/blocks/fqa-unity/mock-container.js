import {
  html,
  render,
  signal,
} from '../../scripts/libs/htm-preact.js';
import { createTag, loadStyle } from '../../scripts/utils.js';

export const data = signal({ src: null, loading: false });

function Canvas() {
  if (!data.value.src) {
    return html`
      <div>
        Image Not Provided
      </div>`;
  }
  return html`
    <div class='canvas'>
      <img src='${data.value.src}' />
    </div>`;
}

function Loader() {
  const hidden = !data.value.loading;
  return html`<div class="loader${hidden ? ' hidden' : ''}"><img src='/express/icons/cc-express.svg' />Loading...</div>`;
}

function Workspace() {
  const hidden = data.value.loading;
  return html`<div class="qa-workspace${hidden ? ' hidden' : ''}">
      <${Canvas} />
      <div class="interactions">
      <div class="ctas"><a href='/' class="button secondary download-cta">Download</a><a class="button open-in-app-cta" href='/'>Open in Adobe Express</a></div>
      <div class="consent">By uploading your image or video, you are agreeing to the Adobe <a href='/'>Terms of Use</a> and <a href='/'>Privacy Policy</a>.</div>
      <div class="free-plan-widget">
        <span class="plan-widget-tag"><img class="icon icon-checkmark" src="/express/icons/checkmark.svg" alt="checkmark" />Free to use</span>
        <span class="plan-widget-tag"><img class="icon icon-checkmark" src="/express/icons/checkmark.svg" alt="checkmark" />No credit card required</span>
      </div>
      <div class="pb-30px">Explore more Quick Actions. <strong>It's free.</strong></div>
      <div class="explore">
        <a href='/'><img src='/express/blocks/fqa-unity/resize.svg' />Resize image</a>
        <a href='/'><img src='/express/blocks/fqa-unity/crop.svg' />Crop image</a>
        <a href='/'><img src='/express/blocks/fqa-unity/convert.svg' />Convert to PNG</a>
        <a href='/'><img src='/express/blocks/fqa-unity/convert.svg' />Convert to SVG</a>
        <a href='/'><img src='/express/blocks/fqa-unity/convert.svg' />Convert to JPG</a>
      </div>
    </div>
  </div>`;
}

function Layout() {
  const hidden = !data.value.src;
  return html`
    <div class="qa-workspace-layout${hidden ? ' hidden' : ''}">
      <${Loader} />
      <${Workspace} />
    </div>
  `;
}

function getLayout() {
  return html`<${Layout} />`;
}

export default async function initUnityPOC(container) {
  await new Promise((res) => {
    loadStyle('/express/blocks/fqa-unity/container.css', res);
  });
  const wrapper = createTag('div');
  render(getLayout(), wrapper);
  container.append(wrapper);
}
