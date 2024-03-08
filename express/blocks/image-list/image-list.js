import { toClassName } from '../../utils/utils.js';

export default function decorate($block) {
  const $rows = Array.from($block.children);
  $rows.forEach(($row) => {
    const $cells = Array.from($row.children);
    if ($cells[2]) {
      const device = toClassName($cells[2].textContent.trim());
      if (device) $row.classList.add(`${device}-only`);
      $cells[2].remove();
    }
    if ($cells[1]) {
      const $a = $cells[1].querySelector('a');
      if ($a) {
        $a.innerHTML = $cells[0].innerHTML;
        $cells[0].remove();
      } else {
        $cells[1].remove();
      }
    }
  });
}
