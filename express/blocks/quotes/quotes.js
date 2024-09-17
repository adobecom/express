// eslint-disable-next-line import/no-unresolved
import { addTempWrapper } from '../../scripts/decorate.js';
import { createTag, pickOneFromArray } from '../../scripts/utils.js';
import { throttle } from '../../scripts/hofs.js';

export default function decorate($block) {
  console.log('=== ENTERING decorate');

  addTempWrapper($block, 'quotes');

  const isSingularVariant = $block.classList.contains('singular');

  console.log('=== $block, isSingularVariant', $block, isSingularVariant);
  // return;

  if (isSingularVariant) {

    // function setMobileBackground($el, backgroundUrl) {
    //   console.log("=== in setMobileBackground", new Date())
    //   const backgroundCSS = `no-repeat 15% -12%  url("${backgroundUrl}")`; // mobile
    //   // const backgroundCSS = `no-repeat calc(-600px + 45%) 0   url("${backgroundUrl}"), no-repeat calc(600px + 45%) 0  url("${backgroundUrl}")`;

    //   $el.style.background = backgroundCSS;
    // }

    // function setDesktopBackground($el, backgroundUrl) {
    //   // const backgroundCSS = `no-repeat 15% -12%  url("${backgroundUrl}")`; // mobile
    //   console.log("=== in setDesktopBackground", new Date())
    //   // const backgroundCSS = `no-repeat calc(-400px + 20%) -12%  url("${backgroundUrl}"), no-repeat 1000px -12%  url("${backgroundUrl}")`;
    //   const backgroundCSS = `no-repeat calc(-600px + 50%) 0   url("${backgroundUrl}"), no-repeat calc(600px + 50%) 0  url("${backgroundUrl}")`; // static relative to middle region
    //   // const backgroundCSS = `no-repeat calc(-450px + 30%) 0   url("${backgroundUrl}"), no-repeat calc(500px + 70%) 0  url("${backgroundUrl}")`;

    //   $el.style.background = backgroundCSS;
    // }
    // function setBackground() {
    //   return;
    //   if (window.innerWidth < 600) {
    //     setMobileBackground($block, backgroundUrl);
    //   } else {
    //     setDesktopBackground($block, backgroundUrl);
    //   }
    // }

    const $rows = [...$block.querySelectorAll(':scope>div')];

    console.log('=== rows', $rows);

    const $newBlock = createTag('div', { class: 'new-block' });

    // The Desktop design has a different element layout from the mobile design, plus
    // the desktop design uses the background image twice, while the mobile design uses
    // it once. Because of the many differences, it may be simpler to divide them into two fragments
    const $quoteContainer = createTag('div', { class: 'quote-container' });
    const $quoteDesktop = createTag('div', { class: 'quote-desktop' });
    const $quoteMobile = createTag('div', { class: 'quote-mobile' });


    const $quoteDesktopBackground = createTag('div', { class: 'background' });

    const $quoteMobileBackground = createTag('div', { class: 'background' });

    $quoteDesktop.append($quoteDesktopBackground)
    $quoteMobile.append($quoteMobileBackground)
    $quoteContainer.append($quoteDesktop);
    $quoteContainer.append($quoteMobile);

    // $newBlock.innerHTML = "Hello World";

    // // return $newBlock;

    // $block.replaceChildren($newBlock);
    // return;

    console.log('=== $rows[$rows.length - 1]', $rows[$rows.length - 1]);

    console.log(
      '=== $rows[$rows.length - 1].children',
      $rows[$rows.length - 1].children
    );

    console.log(
      '=== $rows[$rows.length - 1].children',
      $rows[$rows.length - 1].children[0].innerHTML
    );
    console.log(
      '=== $rows[$rows.length - 1].children',
      $rows[$rows.length - 1].children[1].innerHTML
    );
    // if ($rows[$rows.length - 1])

    console.log(
      '=== $rows[$rows.length - 1].children[0].textContent',
      JSON.stringify($rows[$rows.length - 1].children[0].textContent)
    );
    console.log(
      '=== $rows[$rows.length - 1].children[0].innerText',
      JSON.stringify($rows[$rows.length - 1].children[0].innerText)
    );

    const $lastRow = $rows[$rows.length - 1];

    let hasBackground, backgroundUrl, $quotes;
    if ($lastRow.children[0].innerText.trim().toLowerCase() === 'background') {
      hasBackground = true;
      const $img = $lastRow.children[1].querySelector('img');
      console.log('=== img', $img);
      backgroundUrl = $img.src;
      console.log('=== backgroundUrl', backgroundUrl);
      $quotes = $rows.slice(0, $rows.length - 1);
      // $newBlock.parentElement.parentElement.style.background = `repeat-x 40% 0%  url("${backgroundUrl}")`

      console.log('=== $newBlock.parentElement', $newBlock.parentElement);
      console.log('=== $newBlock.parentNode', $newBlock.parentNode);

      // $newBlock.style.background = `repeat-x -90% 0%  url("${backgroundUrl}")`

      // const backgroundCSS = `no-repeat -24% -12%  url("${backgroundUrl}"), no-repeat 110% -12%  url("${backgroundUrl}")`;
      // console.log("=== backgroundCSS", backgroundCSS)  // desktop

      // ALSO NOTE LAYOUT IS CHANGED

      // console.log('=== backgroundCSS', backgroundCSS);

      // window.addEventListener('resize', throttle(() => {
      //   console.log('=== window RESIZE');
      //   setBackground();
      // }, 300, {trailing: true}));

      // setBackground();

      const backgroundDesktopCSS = `no-repeat calc(-600px + 50%) 0   url("${backgroundUrl}"), no-repeat calc(600px + 50%) 0  url("${backgroundUrl}")`; // static relative to middle region
      $quoteDesktopBackground.style.background = backgroundDesktopCSS;

      // const backgroundMobileCSS = `no-repeat 15% -12%  url("${backgroundUrl}")`; // mobile
      const backgroundMobileCSS = `no-repeat 15% 52%  url("${backgroundUrl}")`; // mobile
      // const backgroundCSS = `no-repeat calc(-600px + 45%) 0   url("${backgroundUrl}"), no-repeat calc(600px + 45%) 0  url("${backgroundUrl}")`;

      $quoteMobileBackground.style.background = backgroundMobileCSS;

      // $block.addEventListener("resize", () => {
      //   console.log("=== block RESIZE");
      // })

      // $block.style.background = backgroundCSS;
      // $block.style.backgroundBlendMode = 'lighten, soft-light';
      // $block.style.backgroundBlendMode = 'lighten';

      // $block.style.backgroundBlendMode= 'lighten';
      // $block.style.backgroundBlendMode= 'soft-light';
      // $block.style.backgroundBlendMode= 'multiply';
      // `no-repeat-x -90% 0%  url("${backgroundUrl}), no-repeat -30% 0%  url("${backgroundUrl}")")`

      //     $newBlock.style.background = `radial-gradient(circle, #0000 45%, #000f 48%),
      // radial-gradient(ellipse farthest-corner, #fc1c14 20%, #cf15cf 80%);`;
    } else {
      hasBackground = false;
      $quotes = $rows;
    }

    // $quotes = [pickOneFromArray($quotes)];
    const $card = pickOneFromArray($quotes);

    // console.log("=== ALL", $block.querySelectorAll(':scope>div'));
    // console.log("=== ALL2", $block.querySelectorAll('div'));

    // console.log("=== ONE", $block.querySelector(':scope>div'));
    // console.log("=== ONE2", $block.querySelector('div'));

    console.log(
      '=== $card, hasBackground, backgroundUrl',
      $card,
      hasBackground,
      backgroundUrl
    );

    // $quotes.forEach(($card) => {
      console.log('=== card', $card, $card.querySelector);

      // $card.classList.add("quote");

      console.log('=== children', $card.children[0]);

      const $picture = $card.querySelector('picture');

      console.log('=== $picture', $picture);

      const $quote = createTag('div', { class: 'quote' });

      const $authorImg = createTag('div', { class: 'image' });

      $quote.append($authorImg);
      $authorImg.append($picture);

      // $newBlock.append($picture);

      const $quoteText = createTag('div', { class: 'quote-text' });

      const $quoteTextComment = createTag('div', { class: 'quote-comment' });

      const $review = $card.children[0];
      $quoteTextComment.append(
        `“${$review.innerText.replace(/”$/, '').replace(/"$/, '')}”`
      );

      $quoteText.append($quoteTextComment);

      const $quoteForMobile = createTag('div', { class: 'quote' });

      const $quoteTextMobile = createTag('div', { class: 'quote-text' });


      const $quoteTextCommentMobile = $quoteTextComment.cloneNode(true);

      $quoteTextMobile.append($quoteTextCommentMobile)

      $quoteMobile.append($quoteForMobile)
      $quoteForMobile.append($quoteTextMobile);


      const authorDescription = $card.children[1].innerText;
      const authorDescription2 = $card.children[1].innerText
        .trim()
        .replace(/\n/, ',');
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

      // $quoteMobile.append($quoteTextAuthorPanelMobile);
      $quoteTextMobile.append($quoteTextAuthorPanelMobile);
      // $quoteText.append($quoteTextAuthorPanelMobile);

      $quote.append($quoteText);



      // $quoteMobile.append($quoteMobileBackground)

      // $quoteContainer.append($quoteMobile);
      $quoteDesktop.append($quoteDesktopBackground)
      $quoteDesktop.append($quote)

      $quoteContainer.append($quoteDesktop);
      // $newBlock.append($quote);

      // $block.replaceChildren($quote);

      // console.log('=== FINAL $block', $block);
    // });
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
