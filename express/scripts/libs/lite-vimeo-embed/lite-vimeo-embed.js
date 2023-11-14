import { addPrefetch, getThumbnailDimensions, canUseWebP } from './utils.js';

class LiteVimeo extends HTMLElement {
  connectedCallback() {
    this.videoId = encodeURIComponent(this.getAttribute('videoid'));
    this.thumbnail = this.getAttribute('thumbnail');
    this.language = this.getAttribute('language');
    let { width, height } = getThumbnailDimensions(this.getBoundingClientRect());
    const devicePixelRatio = window.devicePixelRatio || 1;
    width *= devicePixelRatio;
    height *= devicePixelRatio;

    let thumbnailUrl = `https://lite-vimeo-embed.now.sh/thumb/${this.videoId}`;
    thumbnailUrl += `.${canUseWebP() ? 'webp' : 'jpg'}`;
    thumbnailUrl += `?mw=${width}&mh=${height}&q=${devicePixelRatio > 1 ? 70 : 85}`;

    this.style.backgroundImage = `url("${this.thumbnail || thumbnailUrl}")`;
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.classList.add('ltv-playbtn');
    this.appendChild(playBtn);
    this.addEventListener('pointerover', LiteVimeo.warmConnections, {
      once: true,
    });
    this.addEventListener('click', () => this._addIframe());
  }

  static warmConnections() {
    if (LiteVimeo.preconnected) return;

    // The iframe document and most of its subresources come right off player.vimeo.com
    addPrefetch('preconnect', 'https://player.vimeo.com');
    // Images
    addPrefetch('preconnect', 'https://i.vimeocdn.com');
    // Files .js, .css
    addPrefetch('preconnect', 'https://f.vimeocdn.com');
    // Metrics
    addPrefetch('preconnect', 'https://fresnel.vimeocdn.com');

    LiteVimeo.preconnected = true;
  }

  _addIframe() {
    const iframeHTML = `
<iframe width="640" height="360" frameborder="0"
allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen
src="https://player.vimeo.com/video/${this.videoId}?autoplay=1&texttrack=${this.language}"
></iframe>`;
    this.insertAdjacentHTML('beforeend', iframeHTML);
    this.classList.add('ltv-activated');
  }
}
customElements.define('lite-vimeo', LiteVimeo);
