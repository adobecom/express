/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { addPrefetch, getThumbnailDimensions, canUseWebP } from './utils.js';

class LiteVimeo extends HTMLElement {
  connectedCallback() {
    this.videoId = encodeURIComponent(this.getAttribute('videoid'));
    this.thumbnail = this.getAttribute('thumbnail');
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
src="https://player.vimeo.com/video/${this.videoId}?autoplay=1"
></iframe>`;
    this.insertAdjacentHTML('beforeend', iframeHTML);
    this.classList.add('ltv-activated');
  }
}
customElements.define('lite-vimeo', LiteVimeo);
