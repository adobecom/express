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

import { createTag } from '../../scripts/utils.js';

export default function init(el) {
  el.querySelectorAll('a:any-link').forEach((a) => {
    const { href } = a;
    const url = new URL(href);
    const suffix = url.pathname.split('/media_')[1];
    const parent = a.parentNode;

    if (href.endsWith('.mp4')) {
      const isAnimation = a.closest('.animation');

      let attribs = { controls: '' };
      if (isAnimation) {
        attribs = {
          playsinline: '', autoplay: '', loop: '', muted: '',
        };
      }
      const poster = a.closest('div').querySelector('img');
      if (poster) {
        attribs.poster = poster.src;
        poster.remove();
      }

      const video = createTag('video', attribs);

      if (href.startsWith('https://hlx.blob.core.windows.net/external/')) {
        video.innerHTML = `<source src=${href} type="video/mp4">`;
      } else {
        video.innerHTML = `<source src="./media_${suffix}" type="video/mp4">`;
      }

      a.parentNode.replaceChild(video, a);
      if (isAnimation) {
        video.addEventListener('canplay', () => {
          video.muted = true;
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // ignore
            });
          }
        });
      }
    }

    const next = parent.nextElementSibling;
    if (next && next.tagName === 'P' && next.innerHTML.trim().startsWith('<em>')) {
      next.classList.add('legend');
    }
  });
}
