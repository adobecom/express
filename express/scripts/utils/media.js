export function transformLinkToAnimation($a, $videoLooping = true) {
    if (!$a || !$a.href.endsWith('.mp4')) {
      return null;
    }
    const params = new URL($a.href).searchParams;
    const attribs = {};
    const dataAttr = $videoLooping ? ['playsinline', 'autoplay', 'loop', 'muted'] : ['playsinline', 'autoplay', 'muted'];
    dataAttr.forEach((p) => {
      if (params.get(p) !== 'false') attribs[p] = '';
    });
    // use closest picture as poster
    const $poster = $a.closest('div').querySelector('picture source');
    if ($poster) {
      attribs.poster = $poster.srcset;
      $poster.parentNode.remove();
    }
    // replace anchor with video element
    const videoUrl = new URL($a.href);
  
    const isLegacy = videoUrl.hostname.includes('hlx.blob.core') || videoUrl.pathname.includes('media_');
    const $video = createTag('video', attribs);
    if (isLegacy) {
      const helixId = videoUrl.hostname.includes('hlx.blob.core') ? videoUrl.pathname.split('/')[2] : videoUrl.pathname.split('media_')[1].split('.')[0];
      const videoHref = `./media_${helixId}.mp4`;
      $video.innerHTML = `<source src="${videoHref}" type="video/mp4">`;
    } else {
      $video.innerHTML = `<source src="${videoUrl}" type="video/mp4">`;
    }
  
    const $innerDiv = $a.closest('div');
    $innerDiv.prepend($video);
    $innerDiv.classList.add('hero-animation-overlay');
    $video.setAttribute('tabindex', 0);
    $a.replaceWith($video);
    // autoplay animation
    $video.addEventListener('canplay', () => {
      $video.muted = true;
      const playPromise = $video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // ignore
        });
      }
    });
    return $video;
  }