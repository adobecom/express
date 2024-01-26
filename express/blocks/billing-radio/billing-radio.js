// one-off radio buttons for plans
import { createTag } from '../../scripts/utils.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

// multiple live on same page
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

export default function init(el) {
  const blockId = getId();
  const title = el.querySelector('strong');
  const plans = Array.from(el.querySelectorAll('ol > li')).map((li) => li.textContent.trim());
  el.innerHTML = '';
  el.append(title);
  plans.forEach((plan, planIndex) => {
    const wrapper = createTag('div');
    wrapper.addEventListener('change', () => {
      BlockMediator.set('billing-plan', planIndex);
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

  if (!BlockMediator.hasStore('billing-plan')) BlockMediator.set('billing-plan', 0);
  BlockMediator.subscribe('billing-plan', ({ newValue, oldValue }) => {
    el.querySelector(`input[value="${oldValue}"]`).checked = false;
    el.querySelector(`input[value="${newValue}"]`).checked = true;
  });
}
