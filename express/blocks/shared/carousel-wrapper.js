import buildCarousel from './carousel.js';
import buildBasicCarousel from './basic-carousel.js';

function loadCarousel(selector, parent, options) {
  const useBasicCarousel = parent.closest('.basic-carousel');
  const carouselLoader = useBasicCarousel ? buildBasicCarousel : buildCarousel;
  return carouselLoader(selector, parent, options);
}

export default loadCarousel;
