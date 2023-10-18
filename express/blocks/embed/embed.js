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
  embedInstagram,
  embedSpark,
  embedTwitter,
  embedVimeo,
  embedYoutube,
  getDefaultEmbed,
} from '../../scripts/embed-videos.js';

// 'open.spotify.com' returns 'spotify'
function getServer(url) {
  const l = url.hostname.lastIndexOf('.');
  return url.hostname.substring(url.hostname.lastIndexOf('.', l - 1) + 1, l);
}

const EMBEDS_CONFIG = {
  'www.youtube.com': {
    type: 'youtube',
    embed: embedYoutube,
  },
  'video.tv.adobe.com': {
    type: 'adobe-tv',
    embed: getDefaultEmbed,
  },
  'www.instagram.com': {
    type: '',
    embed: embedInstagram,
  },
  'www.vimeo.com': {
    type: 'vimeo-player',
    embed: embedVimeo,
  },
  'player.vimeo.com': {
    type: 'vimeo-player',
    embed: embedVimeo,
  },
  'spark.adobe.com': {
    type: 'adobe-spark',
    embed: embedSpark,
  },
  'twitter.com': {
    type: 'twitter',
    embed: embedTwitter,
  },
};

function decorateBlockEmbeds(block) {
  block.querySelectorAll('.embed.block a[href]').forEach((a) => {
    const url = new URL(a.href.replace(/\/$/, ''));
    const config = EMBEDS_CONFIG[url.hostname];

    block.innerHTML = '';

    if (config) {
      block.append(config.embed(url));
      block.className = `block embed embed-${config.type}`;
    } else {
      block.append(getDefaultEmbed(url));
      block.className = `block embed embed-${getServer(url)}`;
    }
  });
}

export default function decorate(block) {
  decorateBlockEmbeds(block);
}
