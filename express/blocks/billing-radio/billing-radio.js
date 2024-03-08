// fires 'billing-plan' BM and has global sync values when multiple on same page
import { createTag } from '../../utils/utils.js';
import BlockMediator from '../../features/block-mediator.min.js';
import { addTempWrapper } from '../../utils/decorate.js';

const getId = (function idSetups() {
  const gen = (function* g() {
    let id = 0;
    while (true) {
      yield id;
      id += 1;
    }
  }());
  return () => gen.next().value;
}());

const BILLING_PLAN = 'billing-plan';

export default function init(el) {
  addTempWrapper(el, 'billing-radio');

  const blockId = getId();
  const title = el.querySelector('strong');
  const plans = Array.from(el.querySelectorAll('ol > li')).map((li) => li.textContent.trim());
  el.innerHTML = '';
  el.append(title);
  plans.forEach((plan, planIndex) => {
    const wrapper = createTag('div');
    wrapper.addEventListener('change', () => {
      BlockMediator.set(BILLING_PLAN, planIndex);
    });
    const label = createTag('label', {}, plan);
    const radio = createTag('input', {
      type: 'radio', name: `billing-${blockId}`, value: planIndex,
    });
    label.prepend(radio);
    wrapper.append(label);
    el.append(wrapper);
  });
  el.querySelector('input[type="radio"]').checked = true;

  if (!BlockMediator.hasStore(BILLING_PLAN)) BlockMediator.set(BILLING_PLAN, 0);
  BlockMediator.subscribe(BILLING_PLAN, ({ newValue, oldValue }) => {
    el.querySelector(`input[value="${oldValue}"]`).checked = false;
    el.querySelector(`input[value="${newValue}"]`).checked = true;
  });
}
