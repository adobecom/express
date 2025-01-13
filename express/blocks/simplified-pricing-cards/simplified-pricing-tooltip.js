import {
  createTag,
  getIconElement,
} from '../../scripts/utils.js';

export function adjustElementPosition() {
  const elements = document.querySelectorAll('.tooltip-text');

  if (elements.length === 0) return;
  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      element.classList.remove('overflow-left');
      element.classList.add('overflow-right');
    } else if (rect.left < 40) {
      element.classList.remove('overflow-right');
      element.classList.add('overflow-left');
    }
  }
}

export function handleTooltip(pricingArea) {
  const elements = pricingArea.querySelectorAll('p');
  const pattern = /\(\(([^]+)\)\)([^]+)\(\(\/([^]+)\)\)/g;
  let tooltip;
  let tooltipDiv;

  Array.from(elements).forEach((p) => {
    const res = pattern.exec(p.textContent);
    if (res) {
      tooltip = res;
      tooltipDiv = p;
    }
  });
  if (!tooltip) return;

  tooltipDiv.innerHTML = tooltipDiv.innerHTML.replace(pattern, '');
  const tooltipText = tooltip[2];
  tooltipDiv.classList.add('tooltip');
  const span = createTag('div', { class: 'tooltip-text' });
  span.innerText = tooltipText;
  const icon = getIconElement('info', 44, 'Info', 'tooltip-icon');
  icon.append(span);
  icon.setAttribute('tabindex',1)
  const iconWrapper = createTag('button');
  iconWrapper.append(icon);
  iconWrapper.append(span);
  tooltipDiv.append(iconWrapper);
  iconWrapper.addEventListener('click', adjustElementPosition);
  window.addEventListener('resize', adjustElementPosition);
}
