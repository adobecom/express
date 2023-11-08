/* eslint-disable import/named, import/extensions */

export default function decorateCheckerBoards($block) {
  const blobPrefix = 'https://hlx.blob.core.windows.net/external/';
  const $a = $block.querySelector(`a[href^="${blobPrefix}`);
  if ($a.href.endsWith('.mp4')) {
    const hostPrefix = window.location.hostname.includes('localhost') ? 'https://spark-website--adobe.hlx.live' : '';
    const $cell = $a.closest('div');
    const vid = $a.href.substring(blobPrefix.length).split('#')[0];
    $cell.innerHTML = `<video playsinline autoplay loop muted><source loading="lazy" src="${hostPrefix}/hlx_${vid}.mp4" type="video/mp4"></video>`;
  }
}
