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

    if (config) {
      block.innerHTML = config.embed(url);
      block.classList = `block embed embed-${config.type}`;
    } else {
      block.innerHTML = getDefaultEmbed(url);
      block.classList = `block embed embed-${getServer(url)}`;
    }
  });
}

export default function decorate(block) {
  decorateBlockEmbeds(block);
}
