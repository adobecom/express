import { createTag, fetchRelevantRows } from '../../utils/utils.js';
import { addTempWrapper } from '../../utils/decorate.js';
import { buildFreePlanWidget } from '../../components/free-plan.js';
import buildPaginatedCarousel from '../../components/paginated-carousel.js';
import { buildAppStoreBadge } from '../../components/app-store-badge.js';

export default async function decorate($block) {
  addTempWrapper($block, 'carousel-card-mobile');

  const payload = {
    carouselArray: [],
    other: [],
    relevantRowsData: null,
  };

  if ($block.classList.contains('spreadsheet-powered')) {
    payload.relevantRowsData = await fetchRelevantRows(window.location.pathname);

    if (payload.relevantRowsData && payload.relevantRowsData.startFromCard !== 'Y') {
      $block.remove();
    }
  }

  Array.from($block.children).forEach(($row) => {
    const $columns = Array.from($row.children);
    const parameter = $columns[0].textContent.trim();
    const $value = $columns[1];

    if (parameter === 'Heading') {
      const $heading = createTag('h3');
      let headingText = $value.textContent;

      if (payload.relevantRowsData && payload.relevantRowsData.startFromCardTitle) {
        headingText = payload.relevantRowsData.startFromCardTitle;
      }

      $heading.textContent = headingText;
      $row.replaceWith($heading);
    } else if (parameter === 'Feature Carousel') {
      buildPaginatedCarousel(':scope > div > p', $row, false);
    } else if (parameter === 'App Store Badge') {
      $row.replaceWith(buildAppStoreBadge($value.firstElementChild.href, { class: 'gradient-border' }));
    } else {
      payload.other.push($columns);
    }
  });

  const freePlanTags = await buildFreePlanWidget('branded');
  $block.insertAdjacentElement('afterend', freePlanTags);
}
