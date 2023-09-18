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

import './lite-vimeo-embed.css';
import { addPrefetch, getThumbnailDimensions, canUseWebP } from './utils.js';

class LiteVimeo extends HTMLElement {
constructor() {
    super();
    // TODO: support dynamically setting the attribute via attributeChangedCallback
}

  connectedCallback() {
    // Gotta encode the untrusted value
    // https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#rule-2---attribute-escape-before-inserting-untrusted-data-into-html-common-attributes
    this.videoId = encodeURIComponent(this.getAttribute('videoid'));

    /**
     * Lo, the vimeo placeholder image!  (aka the thumbnail, poster image, etc)
     * We have to use the Vimeo API.
     */
    let { width, height } = getThumbnailDimensions(this.getBoundingClientRect());
    const devicePixelRatio = window.devicePixelRatio || 1;
    width *= devicePixelRatio;
    height *= devicePixelRatio;

    let thumbnailUrl = `https://lite-vimeo-embed.now.sh/thumb/${this.videoId}`;
    thumbnailUrl += `.${canUseWebP() ? 'webp' : 'jpg'}`;
    thumbnailUrl += `?mw=${width}&mh=${height}&q=${devicePixelRatio > 1 ? 70 : 85}`;

    this.style.backgroundImage = `url("${thumbnailUrl}")`;

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.classList.add('ltv-playbtn');
    this.appendChild(playBtn);

    // On hover (or tap), warm up the TCP connections we're (likely) about to use.
    this.addEventListener('pointerover', LiteVimeo._warmConnections, {
        once: true
    });

    // Once the user clicks, add the real iframe and drop our play button
    // TODO: In the future we could be like amp-youtube and silently swap in the iframe during idle time
    //   We'd want to only do this for in-viewport or near-viewport ones: https://github.com/ampproject/amphtml/pull/5003
    this.addEventListener('click', () => this._addIframe());
}

// // TODO: Support the the user changing the [videoid] attribute
// attributeChangedCallback() {
// }

/**
 * Begin pre-connecting to warm up the iframe load
 * Since the embed's network requests load within its iframe,
 *   preload/prefetch'ing them outside the iframe will only cause double-downloads.
 * So, the best we can do is warm up a few connections to origins that are in the critical path.
 *
 * Maybe `<link rel=preload as=document>` would work, but it's unsupported: http://crbug.com/593267
 * But TBH, I don't think it'll happen soon with Site Isolation and split caches adding serious complexity.
 */
static _warmConnections() {
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
// Register custome element
customElements.define('lite-vimeo', LiteVimeo);