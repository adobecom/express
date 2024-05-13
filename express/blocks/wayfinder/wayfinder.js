// fires 'billing-plan' BM and has global sync values when multiple on same page
import { addTempWrapper } from '../../scripts/decorate.js';

export default function decorate(el) {
  addTempWrapper(el, 'billing-radio');
  const rows = el.querySelectorAll(':scope > div');
  rows[0].classList.add('text-row');
  rows[1].classList.add('cta-row');
  rows[1].querySelectorAll('a').forEach((a) => {
    a.classList.add('button');
  });
}
