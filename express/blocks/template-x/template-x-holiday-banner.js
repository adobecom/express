
import {
  createTag,
  transformLinkToAnimation
} from '../../scripts/utils.js';

function initExpandCollapseToolbar(block, templateTitle, toggle, link) {
  const onToggle = () => {
    block.classList.toggle('expanded');

    if (
      document.body.dataset.device === 'mobile'
      || block.classList.contains('mobile')
    ) {
      const tglBtn = block.querySelector('.toggle-button');
      const heading = templateTitle.querySelector('.toggle-bar-top > h4');

      if (tglBtn && heading) {
        const rect = heading.getBoundingClientRect();
        if (!block.classList.contains('expanded')) {
          tglBtn.style.marginLeft = `${rect.x}px`;
        } else {
          tglBtn.style.removeProperty('margin-left');
        }
      }
    }
  };

  const chev = block.querySelector('.toggle-button-chev');
  templateTitle.addEventListener('click', () => onToggle());
  chev.addEventListener('click', (e) => {
    e.stopPropagation();
    onToggle();
  });

  toggle.addEventListener('click', () => onToggle());
  link.addEventListener('click', (e) => e.stopPropagation());

  setTimeout(() => {
    if (!block.matches(':hover')) {
      onToggle();
    }
  }, 3000);
}

export function decorateHoliday(block, props) {
  const main = document.querySelector('main');
  const templateXSection = block.closest(
    'div[class="section section-wrapper template-x-container"]',
  );
  const mobileViewport = window.innerWidth < 901;
  const templateTitle = block.querySelector('.template-title');
  const toggleBar = templateTitle.querySelector('div');
  const heading = templateTitle.querySelector('h4');
  const subheading = templateTitle.querySelector('p');
  const link = templateTitle.querySelector('.template-title-link');
  const linkWrapper = link.closest('p');
  const toggle = createTag('div', { class: 'toggle-button' });
  const topElements = createTag('div', { class: 'toggle-bar-top' });
  const bottomElements = createTag('div', { class: 'toggle-bar-bottom' });
  const toggleChev = createTag('div', { class: 'toggle-button-chev' });

  if (props.holidayIcon) topElements.append(props.holidayIcon);
  if (props.backgroundAnimation) {
    const animation = transformLinkToAnimation(props.backgroundAnimation);
    block.classList.add('animated');
    block.prepend(animation);
  }

  if (
    templateXSection
    && templateXSection.querySelectorAll('div.block').length === 1
  ) main.classList.add('with-holiday-templates-banner');
  block.classList.add('expanded', props.textColor);
  toggleBar.classList.add('toggle-bar');
  topElements.append(heading);
  toggle.append(link, toggleChev);
  linkWrapper.remove();
  bottomElements.append(subheading);
  toggleBar.append(topElements, bottomElements);
  block.style.backgroundColor = props.backgroundColor;

  if (mobileViewport) {
    block.classList.add('mobile');
    block.append(toggle);
  } else {
    toggleBar.append(toggle);
  }

  initExpandCollapseToolbar(block, templateTitle, toggle, link);
}