/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable import/named, import/extensions */

import {
  loadScript,
  createTag,
  loadCSS,
// eslint-disable-next-line import/no-unresolved
} from './scripts.js';
import { getAvailableVimeoSubLang } from '../blocks/shared/video.js';

function isInTextNode(node) {
  return node.parentElement.firstChild.nodeType === Node.TEXT_NODE;
}

function getDefaultEmbed(url) {
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
  const src = `https://www.youtube.com/embed/${id}?${searchParams.toString()}`;
  const embedHTML = `
  <div class="embed-youtube">
    <iframe width="100%" height="auto" src="${src}" class="youtube"
      webkitallowfullscreen mozallowfullscreen allowfullscreen
      allow="encrypted-media; accelerometer; gyroscope; picture-in-picture"
      scrolling="no"
      title="${title}">
    </iframe>
  </div>`;
  a.insertAdjacentHTML('afterend', embedHTML);
  a.remove();
}

export function embedVimeo(a) {
  if (isInTextNode(a)) return;
  const url = new URL(a.href);
  let src = url.href;
  const language = getAvailableVimeoSubLang();
  if (url.hostname !== 'player.vimeo.com') {
    const video = url.pathname.split('/')[1];
    src = `https://player.vimeo.com/video/${video}?app_id=122963&texttrack=${language}`;
  }
  loadScript('/express/scripts/libs/LiteYTEmbed-0.2.0/lite-vimeo-embed.js');
  loadCSS('/express/scripts/libs/LiteYTEmbed-0.2.0/lite-vimeo-embed.css');
  // const iframe = createTag('iframe', {
  //   src,
  //   style: 'width: 100%; height: 100%;',
  //   frameborder: '0',
  //   allow: 'autoplay; fullscreen; picture-in-picture',
  //   allowfullscreen: 'true',
  //   title: 'Content from Vimeo',
  //   loading: 'lazy',
  // });
  const embedHTML = `<lite-vimeo videoid="357274789" src=${src}></lite-vimeo>`;
  const wrapper = createTag('div', { class: 'embed-vimeo' }, embedHTML);

  a.parentElement.replaceChild(wrapper, a);
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
