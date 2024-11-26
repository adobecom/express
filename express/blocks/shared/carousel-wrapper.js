import buildCarousel from './carousel.js';
// import buildTemplateXCarousel from './template-x-carousel.js';
import buildBasicCarousel from './basic-carousel.js';

function loadCarousel(selector, parent, options) {
  const useTemplateXCarousel = parent.closest('.template-x-carousel');
  const carouselLoader = useTemplateXCarousel ? buildBasicCarousel : buildCarousel;
  return carouselLoader(selector, parent, options);
}

export default loadCarousel;
