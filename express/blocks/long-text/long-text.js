export default function decorate(block) {
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
