// eslint-disable-next-line import/prefer-default-export
export function addTempWrapper($block, blockName) {
  const wrapper = document.createElement('div');
  const parent = $block.parentElement;
  wrapper.classList.add(`${blockName}-wrapper`);
  parent.insertBefore(wrapper, $block);
  wrapper.append($block);
}

export function decorateHeroSection(h1) {
  const heroPicture = h1.parentElement.querySelector('picture');
  let heroSection;
  const main = document.querySelector('main');
  if (main.children.length === 1) {
    heroSection = document.createElement('div');
    heroSection.id = 'hero';
    const div = document.createElement('div');
    heroSection.append(div);
    if (heroPicture) {
      div.append(heroPicture);
    }
    div.append(h1);
    main.prepend(heroSection);
  } else {
    heroSection = h1.closest('main > div');
    heroSection.id = 'hero';
    heroSection.removeAttribute('style');
  }
  if (heroPicture) {
    heroPicture.classList.add('hero-bg');
  } else {
    heroSection.classList.add('hero-noimage');
  }
}
