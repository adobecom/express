// fires 'billing-plan' BM and has global sync values when multiple on same page
import { createTag } from '../../scripts/utils.js';
import BlockMediator from '../../scripts/block-mediator.min.js';
import { addTempWrapper } from '../../scripts/utils/decorate.js';

const BILLING_PLAN = 'billing-plan';

export default function init(el) {
  addTempWrapper(el, 'billing-radio');

  const title = el.querySelector('strong');
  const plans = Array.from(el.querySelectorAll('ol > li')).map((li) => li.textContent.trim());
  el.innerHTML = '';
  el.append(title);
  const buttons = [];
  if (BlockMediator.get(BILLING_PLAN) === undefined) BlockMediator.set(BILLING_PLAN, 0);
  plans.forEach((plan, planIndex) => {
    const button = createTag('button', {
      id: plan,
      class: planIndex === (BlockMediator.get(BILLING_PLAN) || 0) ? 'checked' : '',
    });
    button.append(createTag('label', { for: plan }, plan));
    button.prepend(createTag('span'));
    button.addEventListener('click', () => {
      if (planIndex === BlockMediator.get(BILLING_PLAN)) return;
      BlockMediator.set(BILLING_PLAN, planIndex);
    });
    el.append(button);
    buttons.push(button);
  });
  BlockMediator.subscribe(BILLING_PLAN, ({ newValue, oldValue }) => {
    buttons[oldValue || 0].classList.remove('checked');
    buttons[newValue].classList.add('checked');
  });
}
