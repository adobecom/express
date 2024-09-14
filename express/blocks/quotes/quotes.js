// eslint-disable-next-line import/no-unresolved
import { addTempWrapper } from "../../scripts/decorate.js";
import { createTag } from "../../scripts/utils.js";

export default function decorate($block) {
  addTempWrapper($block, "quotes");

  const isSingularVariant = $block.classList.contains("singular");

  console.log("=== $block, isSingularVariant", $block, isSingularVariant);
  // return;

  if (isSingularVariant) {
    const $newBlock = createTag("div", { class: "new-block" });

    // $newBlock.innerHTML = "Hello World";

    // // return $newBlock;

    // $block.replaceChildren($newBlock);
    // return;

    $block.querySelectorAll(":scope>div").forEach(($card) => {
      console.log("=== card", $card, $card.querySelector);

      // $card.classList.add("quote");

      console.log("=== children", $card.children[0]);

      const $picture = $card.querySelector("picture");

      console.log("=== $picture", $picture);

      const $quote = createTag("div", { class: "quote" });

      const $authorImg = createTag("div", { class: "image" });

      $quote.append($authorImg);
      $authorImg.append($picture);

      // $newBlock.append($picture);

      const $quoteText = createTag("div", { class: "quote-text" });

      const $quoteTextComment = createTag("div", { class: "quote-comment" });

      const $review = $card.children[0];
      $quoteTextComment.append(
        `“${$review.innerText.replace(/”$/, "").replace(/"$/, "")}”`
      );

      $quoteText.append($quoteTextComment);

      const authorDescription = $card.children[1].innerText;
      const authorDescription2 = $card.children[1].innerText
        .trim()
        .replace(/\n/, ",");
      // .replace(/\s+$/, '');
      // .replace("/\n[^\n]+$/", ",");
      console.log("=== authorDescription", JSON.stringify(authorDescription));
      console.log("=== authorDescription2", JSON.stringify(authorDescription2));
      const $quoteTextAuthorDescription = createTag("div", {
        class: "author-description",
      });
      $quoteTextAuthorDescription.append(authorDescription2);

      $quoteText.append($quoteTextAuthorDescription);

      $quote.append($quoteText);

      $newBlock.append($quote);

      $block.replaceChildren($newBlock);
    });
  } else {
    $block.querySelectorAll(":scope>div").forEach(($card) => {
      $card.classList.add("quote");
      if ($card.children.length > 1) {
        const $author = $card.children[1];
        $author.classList.add("author");
        // Create a container for image and summary
        const $authorContent = createTag("div", { class: "author-content" });

        if ($author.querySelector("picture")) {
          const $authorImg = createTag("div", { class: "image" });
          $authorImg.appendChild($author.querySelector("picture"));
          $authorContent.appendChild($authorImg);
        }

        const $authorSummary = createTag("div", { class: "summary" });
        Array.from($author.querySelectorAll("p"))
          .filter(($p) => !!$p.textContent.trim())
          .forEach(($p) => $authorSummary.appendChild($p));
        $authorContent.appendChild($authorSummary);
        // Append the author content container to author
        $author.appendChild($authorContent);
      }
      $card.firstElementChild.classList.add("content");
    });
  }
}
