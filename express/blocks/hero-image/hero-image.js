function adjustLayout($block) {
  $block.style.minHeight = `${Math.max((window.innerWidth * 700) / 1440, 375)}px`;
}

export default function decorate($block) {
  window.addEventListener('resize', () => {
    adjustLayout($block);
  });
  adjustLayout($block);
}
