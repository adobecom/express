/**
 * Add a <link rel={preload | preconnect} ...> to the head
 */

export function addPrefetch(kind, url, as) {
  const linkElem = document.createElement('link');
  linkElem.rel = kind;
  linkElem.href = url;
  if (as) {
    linkElem.as = as;
  }
  linkElem.crossorigin = true;
  document.head.appendChild(linkElem);
}

export function canUseWebP() {
  const elem = document.createElement('canvas');

  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
}

/**
*
* @param {Object} options
* @param {number} options.width The width of the player
* @param {number} options.height The height of the player
* @return {Object} The width and height
*/
export function getThumbnailDimensions({ width, height }) {
  let roundedWidth = width;
  let roundedHeight = height;

  if (roundedWidth % 320 !== 0) {
    roundedWidth = Math.ceil(width / 100) * 100;
    roundedHeight = Math.round((roundedWidth / width) * height);
  }

  return {
    width: roundedWidth,
    height: roundedHeight,
  };
}
