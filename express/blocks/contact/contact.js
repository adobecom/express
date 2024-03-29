import {
  createTag,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

function decorateContactBlocks($block) {
  const contacts = [];

  const $rows = Array.from($block.children);
  $rows.forEach(($row) => {
    const $cells = Array.from($row.children);
    const $title = $cells[0];
    const $phone = $cells[1];
    const $text = $cells[2];

    const title = $title.textContent.trim();
    const phone = $phone.innerHTML.replace('https://tel/', 'tel:');
    const text = $text.innerHTML;

    contacts.push({
      title, phone, text,
    });
  });

  $block.innerHTML = '';
  contacts.forEach((contact) => {
    const { title, phone, text } = contact;

    const $contact = createTag('div', { class: 'contact-row' });
    $block.append($contact);
    const $title = createTag('span', { class: 'contact-title' });
    $title.innerHTML = title;
    $contact.append($title);
    const $contactBlock = createTag('div', { class: 'contact-container' });
    $contact.append($contactBlock);
    const $phoneContainer = createTag('div', { class: 'contact-phone-container' });
    $contactBlock.append($phoneContainer);
    const $phone = createTag('span', { class: 'contact-phone' });
    $phone.innerHTML = phone;
    $phoneContainer.append($phone);
    const $textContainer = createTag('div', { class: 'contact-text-container' });
    $contactBlock.append($textContainer);
    const $text = createTag('p', { class: 'contact-text' });
    $text.innerHTML = text;
    $textContainer.append($text);
  });
}

export default function decorate($block) {
  decorateContactBlocks($block);
}
