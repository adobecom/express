import { createTag } from '../../scripts/utils.js';

export default function decorate(block, name, doc) {
  doc.querySelectorAll('.animation a[href], .video a[href]').forEach((a) => {
    const { href } = a;
    const url = new URL(href);
    const suffix = url.pathname.split('/media_')[1];
    const parent = a.parentNode;

    if (href.endsWith('.mp4')) {
      const isAnimation = !!a.closest('.animation');
      // const isAnimation = true;

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
      /*
      if (href.startsWith('https://hlx.blob.core.windows.net/external/')) {
        href='/hlx_'+href.split('/')[4].replace('#image','');
      }
      */
      video.innerHTML = `<source src="./media_${suffix}" type="video/mp4">`;
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
