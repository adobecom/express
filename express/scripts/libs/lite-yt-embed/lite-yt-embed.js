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

class LiteYTEmbed extends HTMLElement {
  connectedCallback() {
    this.videoId = this.getAttribute('videoid');

    let playBtnEl = this.querySelector('.lty-playbtn');
    this.playLabel = (playBtnEl && playBtnEl.textContent.trim()) || this.getAttribute('playlabel') || 'Play';

    if (!this.style.backgroundImage) {
      this.style.backgroundImage = `url("https://i.ytimg.com/vi/${this.videoId}/hqdefault.jpg")`;
    }

    if (!playBtnEl) {
      playBtnEl = document.createElement('button');
      playBtnEl.type = 'button';
      playBtnEl.classList.add('lty-playbtn');
      this.append(playBtnEl);
    }
    if (!playBtnEl.textContent) {
      const playBtnLabelEl = document.createElement('span');
      playBtnLabelEl.className = 'lyt-visually-hidden';
      playBtnLabelEl.textContent = this.playLabel;
      playBtnEl.append(playBtnLabelEl);
    }
    playBtnEl.removeAttribute('href');
    this.addEventListener('pointerover', LiteYTEmbed.warmConnections, { once: true });
    this.addEventListener('click', this.addIframe);
    this.needsYTApiForAutoplay = navigator.vendor.includes('Apple') || navigator.userAgent.includes('Mobi');
  }

  static addPrefetch(kind, url, as) {
    const linkEl = document.createElement('link');
    linkEl.rel = kind;
    linkEl.href = url;
    if (as) {
      linkEl.as = as;
    }
    document.head.append(linkEl);
  }

  static warmConnections() {
    if (LiteYTEmbed.preconnected) return;
    LiteYTEmbed.addPrefetch('preconnect', 'https://www.youtube-nocookie.com');
    LiteYTEmbed.addPrefetch('preconnect', 'https://www.google.com');
    LiteYTEmbed.addPrefetch('preconnect', 'https://googleads.g.doubleclick.net');
    LiteYTEmbed.addPrefetch('preconnect', 'https://static.doubleclick.net');
    LiteYTEmbed.preconnected = true;
  }

  fetchYTPlayerApi() {
    if (window.YT || (window.YT && window.YT.Player)) return;

    this.ytApiPromise = new Promise((res, rej) => {
      const el = document.createElement('script');
      el.src = 'https://www.youtube.com/iframe_api';
      el.async = true;
      el.onload = _ => {
        YT.ready(res);
      };
      el.onerror = rej;
      this.append(el);
    });
  }

  async addYTPlayerIframe(params) {
    this.fetchYTPlayerApi();
    await this.ytApiPromise;

    const videoPlaceholderEl = document.createElement('div')
    this.append(videoPlaceholderEl);

    const paramsObj = Object.fromEntries(params.entries());
    /* eslint-disable no-new */
    new YT.Player(videoPlaceholderEl, {
      width: '100%',
      videoId: this.videoId,
      playerVars: paramsObj,
      events: {
        onReady: (event) => {
          event.target.playVideo();
        },
      },
    });
  }

  async addIframe() {
    if (this.classList.contains('lyt-activated')) return;
    this.classList.add('lyt-activated');

    const params = new URLSearchParams(this.getAttribute('params') || []);
    params.append('autoplay', '1');
    params.append('playsinline', '1');

    if (this.needsYTApiForAutoplay) {
      return this.addYTPlayerIframe(params);
    }

    const iframeEl = document.createElement('iframe');
    iframeEl.width = 560;
    iframeEl.height = 315;
    iframeEl.title = this.playLabel;
    iframeEl.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
    iframeEl.allowFullscreen = true;
    iframeEl.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(this.videoId)}?${params.toString()}`;
    this.append(iframeEl);
    iframeEl.focus();
  }
}

customElements.define('lite-youtube', LiteYTEmbed);