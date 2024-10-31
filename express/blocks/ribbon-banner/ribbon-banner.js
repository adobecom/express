export default function init(el) {
  const row = el.querySelector(':scope > div');
  row.classList.add('row');
  [...el.querySelectorAll('a')].forEach((a) => {
    a.classList.add('button', 'reverse');
    row.append(a);
  });
  return el;
}
