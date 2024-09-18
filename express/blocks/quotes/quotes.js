// eslint-disable-next-line import/no-unresolved
import { addTempWrapper } from '../../scripts/decorate.js';
import { createTag, pickRandomFromArray } from '../../scripts/utils.js';
// import { throttle } from '../../scripts/hofs.js';

const DEFAULT_BACKGROUND_OPACITY = 1;

export default function decorate($block) {
  console.log('=== ENTERING decorate');

  addTempWrapper($block, 'quotes');

  const isSingularVariant = $block.classList.contains('singular');

  console.log('=== $block, isSingularVariant', $block, isSingularVariant);

  if (isSingularVariant) {
    const $rows = [...$block.querySelectorAll(':scope>div')];

    console.log('=== rows', $rows);

    // const $newBlock = createTag('div', { class: 'new-block' });

    // The Desktop design has a different element layout from the mobile design, plus
    // the desktop design uses the background image twice, while the mobile design uses
    // it once. Because of the many differences, it may be simpler to divide them into two fragments
    const $quoteContainer = createTag('div', { class: 'quote-container' });
    const $desktopContainer = createTag('div', { class: 'desktop-container' });
    const $mobileContainer = createTag('div', { class: 'mobile-container' });

    const $desktopContainerBackground = createTag('div', { class: 'background' });

    const $mobileContainerBackground = createTag('div', { class: 'background' });

    $desktopContainer.append($desktopContainerBackground);
    $mobileContainer.append($mobileContainerBackground);
    $quoteContainer.append($desktopContainer);
    $quoteContainer.append($mobileContainer);

    console.log('=== $rows[$rows.length - 1]', $rows[$rows.length - 1]);

    console.log('=== $rows[$rows.length - 1].children', $rows[$rows.length - 1].children);

    console.log(
      '=== $rows[$rows.length - 1].children',
      $rows[$rows.length - 1].children[0].innerHTML
    );
    console.log(
      '=== $rows[$rows.length - 1].children',
      $rows[$rows.length - 1].children[1].innerHTML
    );

    console.log(
      '=== $rows[$rows.length - 1].children[0].textContent',
      JSON.stringify($rows[$rows.length - 1].children[0].textContent)
    );
    console.log(
      '=== $rows[$rows.length - 1].children[0].innerText',
      JSON.stringify($rows[$rows.length - 1].children[0].innerText)
    );

    let $lastRow = $rows[$rows.length - 1];

    let hasOpacity, opacitySpecified;
    if ($lastRow.children[0].textContent.trim().toLowerCase() === 'opacity') {
      hasOpacity = true;
      console.log(
        '=== $lastRow.children[1] opacity',
        $lastRow.children[1],
        JSON.stringify($lastRow.children[1].innerText),
        JSON.stringify($lastRow.children[1].textContent)
      );
      opacitySpecified = +$lastRow.children[1].textContent;
      $rows.pop();
    } else {
      hasOpacity = false;
    }

    console.log('=== hasOpacity, opacitySpecified', hasOpacity, opacitySpecified);

    $lastRow = $rows[$rows.length - 1];

    let hasBackground, backgroundUrl;
    if ($lastRow.children[0].textContent.trim().toLowerCase() === 'background') {
      hasBackground = true;
      const $img = $lastRow.children[1].querySelector('img');
      console.log('=== img', $img);
      backgroundUrl = $img.src;
      console.log('=== backgroundUrl', backgroundUrl);

      $rows.pop();
      // $quotes = $rows.slice(0, $rows.length - 1);

      // console.log('=== $newBlock.parentElement', $newBlock.parentElement);
      // console.log('=== $newBlock.parentNode', $newBlock.parentNode);

      const backgroundDesktopCSS = `no-repeat calc(-600px + 50%) 0 url("${backgroundUrl}"), no-repeat calc(600px + 50%) 0  url("${backgroundUrl}")`;
      $desktopContainerBackground.style.background = backgroundDesktopCSS;
      $desktopContainerBackground.style.opacity = opacitySpecified ?? DEFAULT_BACKGROUND_OPACITY;

      const backgroundMobileCSS = `no-repeat 15% 12% url("${backgroundUrl}")`;
      $mobileContainerBackground.style.background = backgroundMobileCSS;
      $mobileContainerBackground.style.opacity = opacitySpecified ?? DEFAULT_BACKGROUND_OPACITY;
    } else {
      hasBackground = false;
      // $quotes = $rows;
    }

    // at this point, $rows contains only quotes (no param)
    const $quoteSelected = pickRandomFromArray($rows);

    console.log(
      '=== $quoteSelected, hasBackground, backgroundUrl',
      $quoteSelected,
      hasBackground,
      backgroundUrl
    );

    console.log('=== card', $quoteSelected, $quoteSelected.querySelector);

    console.log('=== children', $quoteSelected.children[0]);

    const $picture = $quoteSelected.querySelector('picture');

    console.log('=== $picture', $picture);

    const $quoteDesktop = createTag('div', { class: 'quote' });
    // $desktopContainer.append($desktopContainerBackground);
    $desktopContainer.append($quoteDesktop);

    const $authorImgDesktop = createTag('div', { class: 'image' });
    $quoteDesktop.append($authorImgDesktop);

    $authorImgDesktop.append($picture);

    const $quoteDetails = createTag('div', { class: 'quote-details' });
    $quoteDesktop.append($quoteDetails);

    const $quoteComment = createTag('div', { class: 'quote-comment' });
    $quoteDetails.append($quoteComment);

    const $review = $quoteSelected.children[0];

    // $quoteTextComment.append(`“${$review.innerText.replace(/”$/, '').replace(/"$/, '')}”`);
    $quoteComment.append($review.textContent);

    const authorDescription = $quoteSelected.children[1].textContent;

    // const authorDescription2 = $quoteSelected.children[1].innerText.trim().replace(/\n/, ',');
    // .replace(/\s+$/, '');
    // .replace("/\n[^\n]+$/", ",");

    console.log('=== authorDescription', JSON.stringify(authorDescription));

    const $authorDescription = createTag('div', { class: 'author-description' });
    $quoteDetails.append($authorDescription);

    $authorDescription.append(authorDescription);

    // Mobile layout

    const $quoteMobile = createTag('div', { class: 'quote' });
    $mobileContainer.append($quoteMobile);

    const $quoteDetailsMobile = createTag('div', { class: 'quote-details' });
    $quoteMobile.append($quoteDetailsMobile);

    const $quoteCommentMobile = $quoteComment.cloneNode(true);

    $quoteDetailsMobile.append($quoteCommentMobile);

    const $quoteAuthorPanelMobile = createTag('div', {
      class: 'author-panel',
    });
    $quoteDetailsMobile.append($quoteAuthorPanelMobile);


    const $quoteAuthorPhotoMobile = createTag('div', {
      class: 'author-photo',
    });
    $quoteAuthorPanelMobile.append($quoteAuthorPhotoMobile);

    const $pictureCloned = $picture.cloneNode(true);
    console.log('=== $pictureCloned', $pictureCloned);

    $quoteAuthorPhotoMobile.append($pictureCloned);

    $quoteAuthorPanelMobile.append(authorDescription);


    // $quoteContainer.append($desktopContainer);

    $block.replaceChildren($quoteContainer);
    console.log('=== FINAL $block', $block);
  } else {
    $block.querySelectorAll(':scope>div').forEach(($card) => {
      $card.classList.add('quote');
      if ($card.children.length > 1) {
        const $author = $card.children[1];
        $author.classList.add('author');
        // Create a container for image and summary
        const $authorContent = createTag('div', { class: 'author-content' });

        if ($author.querySelector('picture')) {
          const $authorImg = createTag('div', { class: 'image' });
          $authorImg.appendChild($author.querySelector('picture'));
          $authorContent.appendChild($authorImg);
        }

        const $authorSummary = createTag('div', { class: 'summary' });
        Array.from($author.querySelectorAll('p'))
          .filter(($p) => !!$p.textContent.trim())
          .forEach(($p) => $authorSummary.appendChild($p));
        $authorContent.appendChild($authorSummary);
        // Append the author content container to author
        $author.appendChild($authorContent);
      }
      $card.firstElementChild.classList.add('content');
    });
  }
}
