// eslint-disable-next-line import/no-unresolved
import { addTempWrapper } from '../../scripts/decorate.js';
import { createTag, pickOneFromArray } from '../../scripts/utils.js';
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
    if ($lastRow.children[0].innerText.trim().toLowerCase() === 'opacity') {
      hasOpacity = true;
      console.log('$lastRow.children[1]', $lastRow.children[1]);
      opacitySpecified = +$lastRow.children[1].innerText;
      $rows.pop();
    } else {
      hasOpacity = false;
    }

    console.log('=== hasOpacity, opacitySpecified', hasOpacity, opacitySpecified);

    $lastRow = $rows[$rows.length - 1];

    let hasBackground, backgroundUrl;
    if ($lastRow.children[0].innerText.trim().toLowerCase() === 'background') {
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
    const $quoteSelected = pickOneFromArray($rows);

    console.log('=== $quoteSelected, hasBackground, backgroundUrl', $quoteSelected, hasBackground, backgroundUrl);

    console.log('=== card', $quoteSelected, $quoteSelected.querySelector);

    console.log('=== children', $quoteSelected.children[0]);

    const $picture = $quoteSelected.querySelector('picture');

    console.log('=== $picture', $picture);

    const $quote = createTag('div', { class: 'quote' });

    const $authorImg = createTag('div', { class: 'image' });

    $quote.append($authorImg);
    $authorImg.append($picture);

    const $quoteText = createTag('div', { class: 'quote-text' });

    const $quoteTextComment = createTag('div', { class: 'quote-comment' });

    const $review = $quoteSelected.children[0];
    $quoteTextComment.append(`“${$review.innerText.replace(/”$/, '').replace(/"$/, '')}”`);

    $quoteText.append($quoteTextComment);

    const $quoteForMobile = createTag('div', { class: 'quote' });

    const $quoteTextMobile = createTag('div', { class: 'quote-text' });

    const $quoteTextCommentMobile = $quoteTextComment.cloneNode(true);

    $quoteTextMobile.append($quoteTextCommentMobile);

    $mobileContainer.append($quoteForMobile);
    $quoteForMobile.append($quoteTextMobile);

    const authorDescription = $quoteSelected.children[1].innerText;
    const authorDescription2 = $quoteSelected.children[1].innerText.trim().replace(/\n/, ',');
    // .replace(/\s+$/, '');
    // .replace("/\n[^\n]+$/", ",");
    console.log('=== authorDescription', JSON.stringify(authorDescription));
    console.log('=== authorDescription2', JSON.stringify(authorDescription2));
    const $quoteTextAuthorDescription = createTag('div', {
      class: 'author-description',
    });
    $quoteTextAuthorDescription.append(authorDescription2);

    const $quoteTextAuthorPanelMobile = createTag('div', {
      class: 'author-panel-mobile',
    });

    const $quoteTextAuthorPhotoMobile = createTag('div', {
      class: 'author-photo-mobile',
    });

    const $pictureCloned = $picture.cloneNode(true);
    console.log('=== $pictureCloned', $pictureCloned);

    $quoteTextAuthorPhotoMobile.append($pictureCloned);

    $quoteTextAuthorPanelMobile.append($quoteTextAuthorPhotoMobile);

    $quoteTextAuthorPanelMobile.append(authorDescription2);

    $quoteText.append($quoteTextAuthorDescription);

    $quoteTextMobile.append($quoteTextAuthorPanelMobile);

    $quote.append($quoteText);

    // $desktopContainer.append($desktopContainerBackground);
    $desktopContainer.append($quote);

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
