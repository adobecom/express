import {
  createTag,
} from '../../scripts/utils.js';

const PLANS = ['monthly', 'annually'];

function toggleOther(pricingSections, buttons, planIndex) {
  const button = buttons[planIndex];
  if (button.classList.contains('checked')) return;
  buttons.filter((b) => b !== button).forEach((b) => {
    b.classList.remove('checked');
    b.setAttribute('aria-checked', 'false');
  });
  const plan = button.getAttribute('plan');
  button.classList.add('checked');
  button.setAttribute('aria-checked', 'true');
  pricingSections.forEach((section) => {
    if (section.classList.contains(plan)) {
      section.classList.remove('hide');
    } else {
      section.classList.add('hide');
    }
  });
}

function focusNextButton(buttons, currentIndex) {
  const nextIndex = (currentIndex + 1) % buttons.length;
  buttons[nextIndex].focus();
}

function focusPreviousButton(buttons, currentIndex) {
  const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
  buttons[prevIndex].focus();
}

function onKeyDown(e, pricingSections, buttons, toggleWrapper) {
  if (!e.target.isEqualNode(document.activeElement)) return;
  const currentIndex = buttons.indexOf(e.target);
  switch (e.code) {
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      focusPreviousButton(buttons, currentIndex);
      break;
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault();
      focusNextButton(buttons, currentIndex);
      break;
    case 'Enter':
    case 'Space':
      e.preventDefault();
      toggleOther(pricingSections, buttons, currentIndex);
      break;
    case 'Tab':
      toggleWrapper.nextElementSibling.focus();
      break;
    default:
      break;
  }
}

export default function createToggle(
  placeholders, pricingSections, groupID,
) {
  const subDesc = placeholders?.['subscription-type'] || 'Subscription Type:';
  const toggleWrapper = createTag('div', { class: 'billing-toggle' });

  const price = pricingSections[0].querySelector('.pricing-price > strong')?.textContent;
  if (price && parseInt(price, 10) === 0) {
    toggleWrapper.classList.add('hidden');
  }

  toggleWrapper.innerHTML = `<strong>${subDesc}</strong>`;
  toggleWrapper.setAttribute('role', 'radiogroup');
  toggleWrapper.setAttribute('aria-labelledby', groupID);
  const groupLabel = toggleWrapper.children[0];
  groupLabel.setAttribute('id', groupID);
  const buttons = PLANS.map((plan, i) => {
    const buttonID = `${groupID}:${plan}`;
    const defaultChecked = i === 0;
    const button = createTag('button', {
      class: defaultChecked ? 'checked' : '',
      id: buttonID,
      plan,
      tabIndex: defaultChecked ? '' : -1,
    });
    button.appendChild(createTag('span'));
    button.setAttribute('aria-checked', defaultChecked);
    button.setAttribute('aria-labeledby', buttonID);
    const label = placeholders?.[plan] || plan[0].toUpperCase() + plan.slice(1).toLowerCase();
    button.append(createTag('div', { id: `${buttonID}:radio` }, label));
    button.setAttribute('role', 'radio');
    button.addEventListener('click', () => {
      toggleOther(pricingSections, buttons, i);
    });
    return button;
  });

  toggleWrapper.addEventListener('keydown', (e) => {
    onKeyDown(e, pricingSections, buttons, toggleWrapper);
  });

  toggleWrapper.append(...buttons);
  return toggleWrapper;
}
