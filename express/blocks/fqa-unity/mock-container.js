import {
  html,
  render,
  useState,
  useEffect,
  useRef,
} from '../../scripts/libs/htm-preact.js';
import { createTag, loadStyle } from '../../scripts/utils.js';

const MAX_HEIGHT = 600;
const MAX_WIDTH = 800;

function Canvas() {
  const canvas = useRef(null);
  const img = new Image();
  img.src = '/express/blocks/fqa-unity/removed.png';
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

function Workspace() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }, []);
  if (loading) {
    return html`<div class="qa-workspace loading"><div class="loader"><img src='/express/icons/cc-express.svg' />Loading...</div></div>`;
  }
  return html`<div class="qa-workspace">
      <${Canvas} />
      <div class="interactions">
      <div class="ctas"><a href='/' class="button secondary">Download</a><a class="button" href='/'>Open in Adobe Express</a></div>
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

function getWorkspace() {
  return html`<${Workspace} />`;
}

export default async function initUnityPOC(container) {
  await new Promise((res) => {
    loadStyle('/express/blocks/fqa-unity/container.css', res);
  });
  const wrapper = createTag('div');
  render(getWorkspace(), wrapper);
  container.append(wrapper);
}
