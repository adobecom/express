// fires 'billing-plan' BM and has global sync values when multiple on same page
import { createTag } from '../../scripts/utils.js';

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
  const blockId = getId();
  const title = el.querySelector('strong');
  const plans = Array.from(el.querySelectorAll('ol > li')).map((li) => li.textContent.trim());
  el.innerHTML = '';
  el.append(title);
  const { bmd8r } = window;
  plans.forEach((plan, planIndex) => {
    const wrapper = createTag('div');
    wrapper.addEventListener('change', () => {
      bmd8r.set(BILLING_PLAN, planIndex);
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

  if (!bmd8r.hasStore(BILLING_PLAN)) bmd8r.set(BILLING_PLAN, 0);
  bmd8r.subscribe(BILLING_PLAN, ({ newValue, oldValue }) => {
    el.querySelector(`input[value="${oldValue}"]`).checked = false;
    el.querySelector(`input[value="${newValue}"]`).checked = true;
  });
}
