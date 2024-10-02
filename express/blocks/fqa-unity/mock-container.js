import {
  html,
  render,
  useRef,
  signal,
} from '../../scripts/libs/htm-preact.js';
import { createTag, loadStyle } from '../../scripts/utils.js';

const MAX_HEIGHT = 600;
const MAX_WIDTH = 800;

export const data = signal({ src: null, loading: false });

function Canvas() {
  const canvas = useRef(null);
  if (!data.value.src) {
    return html`
      <canvas ref=${canvas} height=${MAX_HEIGHT} width=${MAX_WIDTH}>
        Image Not Provided
      </canvas>`;
  }
  const img = new Image();
  img.src = data.value.src;
  img.onload = () => {
    const ctx = canvas.current.getContext('2d');
    const { height, width } = img;
    const ratio = height / width;
    if (ratio > MAX_HEIGHT / MAX_WIDTH) {
      const adjustedWidth = width * (MAX_HEIGHT / height);
      ctx.drawImage(img, (MAX_WIDTH - adjustedWidth) / 2, 0, adjustedWidth, MAX_HEIGHT);
    } else {
      const adjustedHeight = height * (MAX_WIDTH / width);
      ctx.drawImage(img, 0, (MAX_HEIGHT - adjustedHeight) / 2, MAX_WIDTH, adjustedHeight);
    }
  };
  const onContextMenu = (e) => {
    e.preventDefault();
  };
  return html`
    <canvas ref=${canvas} height=${MAX_HEIGHT} width=${MAX_WIDTH} oncontextmenu=${onContextMenu}>
      Image with its background removed
    </canvas>`;
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
