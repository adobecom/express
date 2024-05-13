// fires 'billing-plan' BM and has global sync values when multiple on same page
import { addTempWrapper } from '../../scripts/decorate.js';

export default function decorate(el) {
  addTempWrapper(el, 'billing-radio');
  const ctaRow = el.querySelectorAll('div')[2];
  ctaRow.classList.add('cta-row');
  ctaRow.querySelectorAll('a').forEach((a) => {
    a.classList.add('button');
  });
}
