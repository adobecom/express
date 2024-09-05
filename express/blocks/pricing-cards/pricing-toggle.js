import {
  createTag,
} from '../../scripts/utils.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

const PLANS = ['monthly', 'annually'];
const SPECIAL_PLAN = 'annual-billed-monthly';

function togglePlan(pricingSections, buttons, planIndex) {
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

function handleKeyNavigation(e, pricingSections, buttons, toggleWrapper) {
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
      togglePlan(pricingSections, buttons, currentIndex);
      break;
    case 'Tab':
      toggleWrapper.nextElementSibling.focus();
      break;
    default:
      break;
  }
}

export default function createToggle(placeholders, pricingSections, monthlyPlanID, yearlyPlanID) {
  const subDesc = placeholders?.['subscription-type'] || 'Subscription Type:';
  const toggleWrapper = createTag('div', {
    class: 'billing-toggle',
    role: 'radiogroup',
    'aria-labelledby': monthlyPlanID,
  });

  const groupLabel = createTag('strong', { id: monthlyPlanID }, subDesc);
  toggleWrapper.appendChild(groupLabel);
  if (BlockMediator.get(monthlyPlanID) === 0) {
    toggleWrapper.classList.add('hidden')
  }
  let hasSpecialPlan = (basePlan) => {return basePlan === 'monthly'}
  
  const buttons = PLANS.map((basePlan, i) => {
    const planLabelID = (BlockMediator.get(monthlyPlanID + "-planType") === 'ABM' && placeholders?.[SPECIAL_PLAN] && basePlan === 'monthly')
      ? SPECIAL_PLAN
      : basePlan;
    const label = placeholders?.[planLabelID];
    const buttonID = `${monthlyPlanID}:${basePlan}`;
   
    if (planLabelID === SPECIAL_PLAN) {
      hasSpecialPlan = (basePlan) => {return basePlan === 'annually'}
    }

    let isDefault = hasSpecialPlan(basePlan)
    const button = createTag('button', {
      class: isDefault ? 'checked' : '',
      id: buttonID,
      plan: basePlan,
      tabIndex: isDefault ? '0' : '-1',
      role: 'radio',
      'aria-checked': isDefault.toString(),
      'aria-labelledby': buttonID,
    });

    button.appendChild(createTag('span'));
    button.append(createTag('div', { id: `${buttonID}:radio` }, label));
    button.setAttribute('role', 'radio');
    button.addEventListener('click', () => {
      togglePlan(pricingSections, buttons, i);
    });

    return button;
  });
  const buttonWrapper = createTag('div', { class: "billing-button-wrapper" })
  buttonWrapper.append(...buttons)
  toggleWrapper.appendChild(buttonWrapper)




  toggleWrapper.addEventListener('keydown', (e) => {
    handleKeyNavigation(e, pricingSections, buttons, toggleWrapper);
  });

  return toggleWrapper;
}
