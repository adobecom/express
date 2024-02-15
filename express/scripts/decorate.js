// eslint-disable-next-line import/prefer-default-export
export function addTempWrapper($block, blockName) {
  const div = document.createElement('div');
  const parent = $block.parentElement;
  div.append($block);
  div.classList.add(`${blockName}-wrapper`);
  parent.append(div);
}
