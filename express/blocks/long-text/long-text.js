// long-text-wrapper's style is defien din long-test.css and long-text block unit test
function addTempWrapper($block, blockName) {
  const div = document.createElement('div');
  const parent = $block.parentElement;
  div.append($block);
  div.classList.add(`${blockName}-wrapper`);
  parent.append(div);
}

export default function decorate(block) {
  addTempWrapper(block, 'long-text');

  if (block.classList.contains('plain')) {
    block.parentElement.classList.add('plain');
  }

  if (block.textContent.trim() === '') {
    if (block.parentElement.classList.contains('long-text-wrapper')) {
      block.parentElement.remove();
    } else {
      block.remove();
    }
  }
}
