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

import {
  loadScript,
  createTag,
  loadCSS,
} from './scripts.js';
import { getAvailableVimeoSubLang } from '../blocks/shared/video.js';

function isInTextNode(node) {
  return node.parentElement.firstChild.nodeType === Node.TEXT_NODE;
}

export function getDefaultEmbed(url) {
  return `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
    <iframe src="${url.href}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen=""
      scrolling="no" allow="encrypted-media" title="Content from ${url.hostname}" loading="lazy">
    </iframe>
  </div>`;
}

export function embedYoutube(a) {
  if (isInTextNode(a)) return;
  const title = !a.textContent.includes('http') ? a.textContent : 'Youtube Video';
  const searchParams = new URLSearchParams(a.search);
  const id = searchParams.get('v') || a.pathname.split('/').pop();
  searchParams.delete('v');
  loadScript('/express/scripts/libs/lite-yt-embed/lite-yt-embed.js', 'module');
  loadCSS('/express/scripts/libs/lite-yt-embed/lite-yt-embed.css');
  const embedHTML = `<lite-youtube videoid="${id}" playlabel="${title}"></lite-youtube>`;
  a.insertAdjacentHTML('afterend', embedHTML);
  a.remove();
}

export function embedVimeo(a, thumbnail) {
  const thumbnailLink = thumbnail?.querySelector('img')?.src;
  if (isInTextNode(a)) return;
  const url = new URL(a.href);
  const src = url.href;
  const language = getAvailableVimeoSubLang();
  if (url.hostname !== 'player.vimeo.com') {
    loadScript('/express/scripts/libs/lite-vimeo-embed/lite-vimeo-embed.js', 'module');
    loadCSS('/express/scripts/libs/lite-vimeo-embed/lite-vimeo-embed.css');
    const video = url.pathname.split('/')[1];
    const embedHTML = `<lite-vimeo videoid="${video}" src=${src} thumbnail=${thumbnailLink} language=${language}></lite-vimeo>`;
    const wrapper = createTag('div', { class: 'embed-vimeo' }, embedHTML);
    a.parentElement.replaceChild(wrapper, a);
  }
  if (thumbnail) thumbnail.remove();
}

export function embedInstagram(url) {
  const location = window.location.href;
  const src = `${url.origin}${url.pathname}${url.pathname.charAt(url.pathname.length - 1) === '/' ? '' : '/'}embed/?cr=1&amp;v=13&amp;wp=1316&amp;rd=${location.endsWith('.html') ? location : `${location}.html`}`;
  const embedHTML = `<div style="width: 100%; position: relative; padding-bottom: 56.25%; display: flex; justify-content: center">
    <iframe class="instagram-media instagram-media-rendered" id="instagram-embed-0" src="${src}"
      allowtransparency="true" allowfullscreen="true" frameborder="0" height="530" style="background: white; border-radius: 3px; border: 1px solid rgb(219, 219, 219);
      box-shadow: none; display: block;">
    </iframe>
  </div>`;
  return embedHTML;
}

export function embedSpark(url) {
  let embedURL = url;
  if (!url.pathname.endsWith('/embed.html') && !url.pathname.endsWith('/embed')) {
    embedURL = new URL(`${url.href}${url.pathname.endsWith('/') ? '' : '/'}embed.html`);
  }

  return getDefaultEmbed(embedURL);
}

export function embedTwitter(url) {
  const embedHTML = `<blockquote class="twitter-tweet"><a href="${url}"></a></blockquote>`;
  loadScript('https://platform.twitter.com/widgets.js');
  return embedHTML;
}
