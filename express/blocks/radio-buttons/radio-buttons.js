// radio buttons that fire block mediator events
import { createTag } from '../../scripts/utils.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

export default function init(el) {
  const title = el.querySelector('strong');
  const plans = Array.from(el.querySelectorAll('ol > li')).map((li) => li.textContent.trim());
  el.innerHTML = '';
  el.append(title);
  plans.forEach((plan, i) => {
    const wrapper = createTag('div');
    wrapper.append(createTag('input', { type: 'radio' }));
    wrapper.append(createTag('label', { for: `plan-${i}` }, plan));
    el.append(wrapper);
  });
  // el.append(container);
}
