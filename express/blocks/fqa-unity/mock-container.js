import {
  html,
  render,
  useState,
  useEffect,
} from '../../scripts/libs/htm-preact.js';
import { createTag, loadStyle } from '../../scripts/utils.js';

function Canvas() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }, []);
  if (loading) {
    return html`<div class="canvas loading"><div class="loader">loading...</div></div>`;
  }
  return html`<div class="canvas"><img src='/express/blocks/fqa-unity/removed.png' /></div>`;
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
  let resStyle;
  const styleLoaded = new Promise((res) => {
    resStyle = res;
  });
  loadStyle('/express/blocks/fqa-unity/container.css', resStyle);
  await styleLoaded;
  const wrapper = createTag('div');
  render(getWorkspace(), wrapper);
  container.append(wrapper);
}
