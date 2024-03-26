/* Seems to be part of pricing logic */
export function addPublishDependencies(url) {
    if (!Array.isArray(url)) {
      // eslint-disable-next-line no-param-reassign
      url = [url];
    }
    window.hlx = window.hlx || {};
    if (window.hlx.dependencies && Array.isArray(window.hlx.dependencies)) {
      window.hlx.dependencies.concat(url);
    } else {
      window.hlx.dependencies = url;
    }
  }
  