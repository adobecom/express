import buildCarousel from '../shared/carousel.js';

function decorateCarousel(links, container) {
  links.forEach((p) => {
    const link = p.querySelector('a');
    link.classList.add('small', 'secondary', 'fill');
    link.classList.remove('accent');
  });
  buildCarousel('p.button-container', container);
}

export function updatePillsByCKG(block, carouselDiv) {
  return (mutationList, observer) => {
    for (const mutation of mutationList) {
      if (mutation.type === 'childList') {
        if (carouselDiv.querySelector('.carousel-container')) {
          observer.disconnect();
          return;
        }

        const newLinks = [...block.querySelectorAll('p.button-container')];
        if (!newLinks.length) {
          carouselDiv.style.display = 'none';
        }
        decorateCarousel(newLinks, carouselDiv);
        observer.disconnect();
        return;
      }
    }
  };
}

export default function decorate(block) {
  const links = [...block.querySelectorAll('p.button-container')];
  const seoCopy = block.querySelectorAll('div')[block.querySelectorAll('div').length - 1];
  const carouselDiv = block.querySelector('div:nth-of-type(2) > div');

  if (links.length) {
    decorateCarousel(links, carouselDiv);
  }

  if (seoCopy) {
    const $paragraphs = seoCopy.querySelectorAll('p');
    for (let i = 0; i < $paragraphs.length; i += 1) {
      $paragraphs[i].classList.add('seo-paragraph');
    }
  }

  const observer = new MutationObserver(updatePillsByCKG(block, carouselDiv));
  observer.observe(carouselDiv, { childList: true });
}
