// fires 'billing-plan' BM and has global sync values when multiple on same page
import { createTag } from '../../scripts/utils.js';
import BlockMediator from '../../scripts/block-mediator.min.js';
import { addTempWrapper } from '../../scripts/decorate.js';

const BILLING_PLAN = 'billing-plan';

export default function init(el) {
  addTempWrapper(el, 'billing-radio');

  const title = el.querySelector('strong');
  const plans = Array.from(el.querySelectorAll('ol > li')).map((li) => li.textContent.trim());
  el.innerHTML = '';
  const fieldSet = createTag('div', { class: 'billing-radio-fieldset' });
  const legend = createTag('div')
  const group = createTag('form', { class: 'billing-radio-group' });
  legend.textContent = title.textContent;
  const buttons = [];
  if (BlockMediator.get(BILLING_PLAN) === undefined) BlockMediator.set(BILLING_PLAN, 0);

  plans.forEach((plan, planIndex) => {
    const radio = createTag('input', {
      type: 'radio', name : BILLING_PLAN, id: plan, value: plan, class: 'billing-radio-item', role: 'radio',
    });
    const label = createTag('label', { for: plan });
    radio.checked = BlockMediator.get(BILLING_PLAN) === planIndex ? "checked" : undefined;
    label.textContent = plan
    radio.innerText = plan
    group.append(radio);
    group.append(label);
    radio.addEventListener('click', () => {
      console.log(planIndex )
      if (planIndex === BlockMediator.get(BILLING_PLAN)) return;
      BlockMediator.set(BILLING_PLAN, planIndex);
    });
    fieldSet.append(legend);
    fieldSet.append(group);
    buttons.push(radio)
  })
  el.append(fieldSet)
  BlockMediator.subscribe(BILLING_PLAN, ({ newValue, oldValue }) => {
  
    buttons[oldValue || 0].checked = undefined
    buttons[newValue].checked = "checked"
  });
}