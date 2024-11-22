import buildCarousel from './carousel.js';
import buildTemplateXCarousel from './template-x-carousel.js';

const useTemplateXCarousel = true;

function loadCarousel(selector, parent, options) {
  const carouselLoader = useTemplateXCarousel ? buildTemplateXCarousel : buildCarousel;
  return carouselLoader(selector, parent, options);
}

export default loadCarousel;
