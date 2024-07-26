import { normalizeHeadings, createTag } from '../../scripts/utils.js';


// export default async function decorate0(block) {
//   normalizeHeadings(block, ['h2', 'h3']);
//   const buttons = block.querySelectorAll('a.button');
//   if (buttons.length > 1) {
//     block.classList.add('multi-button');
//   }
//   // button on dark background
//   buttons.forEach(($button) => {
//     $button.classList.remove('primary');
//     $button.classList.remove('secondary');

//     if (block.classList.contains('light')) {
//       $button.classList.remove('accent');
//       $button.classList.add('large', 'primary', 'reverse');
//     } else {
//       $button.classList.add('accent', 'dark');
//       if (block.classList.contains('multi-button')) {
//         $button.classList.add('reverse');
//       }
//     }
//   });

export default async function decorate(block) {

  // try with class / variant (hihi1, hi2, standout3 hmm)


  console.log("=== block.classList", block.classList)
  const isBannerLightVariant = block.classList.contains('light');
  const isBannerStandoutVariant = block.classList.contains('standout');


  console.log("=== in banner, block is", block);

  for (const child of block.children) {
    console.log("====== CHILD", child, child.tagName);
  }

  console.log("=== in banner, Variant", {
    isBannerLightVariant,
    isBannerStandoutVariant
  });

  if (true || isBannerStandoutVariant) {
    // const standoutContainer = document.createElement('div');
    const standoutContainer = createTag('div', {
      class: "banner-standout-container"
    });

    const standoutMessageContainer = createTag('div', {
      class: "banner-standout-message-container"
    });

    standoutContainer.append(standoutMessageContainer)

    for (const child of block.children) {
      console.log("====== CHILD", child, child.tagName);
      standoutMessageContainer.append(child)
    }

    // block.replaceChildren();
    // block.append(standoutContainer)

    block.replaceChildren(standoutContainer);

    const arrBoldText = [...standoutContainer.querySelectorAll(":scope strong")];
    console.log("=== arrBoldText", arrBoldText)

    const arrGlobalBoldText = document.querySelectorAll("strong");
    console.log("=== arrGlobalBoldText", arrBoldText)

    for (const el of arrBoldText) {
      el.classList.add("banner-standout-text")
    }
    // standoutContainer.append(block);

    // standoutContainer.innerHTML = "haha 1";
    // block.append(standoutContainer)

    // const firstChildOfBlock = block.

    // block.replaceChild(standoutContainer)

  }


  normalizeHeadings(block, ['h2', 'h3']);
  const buttons = block.querySelectorAll('a.button');
  if (buttons.length > 1) {
    block.classList.add('multi-button');
  }
  // button on dark background
  buttons.forEach(($button) => {
    $button.classList.remove('primary');
    $button.classList.remove('secondary');

    if (block.classList.contains('light')) {
      $button.classList.remove('accent');
      $button.classList.add('large', 'primary', 'reverse');
    } else {
      $button.classList.add('accent', 'dark');
      if (block.classList.contains('multi-button')) {
        $button.classList.add('reverse');
      }
    }
  });

  const phoneNumberTags = block.querySelectorAll('a[title="{{business-sales-numbers}}"]');
  if (phoneNumberTags.length > 0) {
    const { formatSalesPhoneNumber } = await import('../../scripts/utils/pricing.js');
    await formatSalesPhoneNumber(phoneNumberTags);
  }

  console.log("=== Before returning")
  // return standoutContainer;
}
