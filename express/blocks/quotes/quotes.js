// eslint-disable-next-line import/no-unresolved
import { addTempWrapper } from '../../scripts/decorate.js';
import { createTag } from '../../scripts/utils.js';

export default function decorate($block) {
  console.log('=== ENTERING decorate');

  addTempWrapper($block, 'quotes');

  const isSingularVariant = $block.classList.contains('singular');

  console.log('=== $block, isSingularVariant', $block, isSingularVariant);
  // return;

  if (isSingularVariant) {
    const $rows = [...$block.querySelectorAll(':scope>div')];

    console.log('=== rows', $rows);

    const $newBlock = createTag('div', { class: 'new-block' });

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

      console.log("=== $newBlock.parentElement", $newBlock.parentElement)
      console.log("=== $newBlock.parentNode", $newBlock.parentNode)

      $newBlock.style.background = `repeat-x -50% 0%  url("${backgroundUrl}")`
  //     $newBlock.style.background = `radial-gradient(circle, #0000 45%, #000f 48%),
  // radial-gradient(ellipse farthest-corner, #fc1c14 20%, #cf15cf 80%);`;
    } else {
      hasBackground = false;
      $quotes = $rows;
    }

    // console.log("=== ALL", $block.querySelectorAll(':scope>div'));
    // console.log("=== ALL2", $block.querySelectorAll('div'));

    // console.log("=== ONE", $block.querySelector(':scope>div'));
    // console.log("=== ONE2", $block.querySelector('div'));

    console.log(
      '=== $quotes, hasBackground, backgroundUrl',
      $quotes,
      hasBackground,
      backgroundUrl
    );

    $quotes.forEach(($card) => {
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

      $quoteText.append($quoteTextAuthorDescription);

      $quote.append($quoteText);

      $newBlock.append($quote);

      $block.replaceChildren($newBlock);
    });
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
