export default function decorate($block) {
  const $fullWidthPicture = $block.querySelector('picture');
  const $section = $block.closest('.section');
  if ($fullWidthPicture) {
    if ($fullWidthPicture.parentNode.tagName === 'DIV') {
      $fullWidthPicture.classList.add('full-width-imageonly');
      $block.classList.add('image-only');
    } else {
      $fullWidthPicture.classList.add('full-width-bg');
    }
  } else {
    $section.classList.add('full-width-noimage');
  }
}
