import { createTag, loadScript } from '../../scripts/utils.js';
import { html, render, useReducer } from '../../scripts/libs/htm-preact.js';
import renderTemplateX from '../template-x/template-x.js';

const reducer = {

};

function Container() {
//   target.addEventListener('paste', (event) => {
//     const clipboard_data = (event.clipboardData || window.clipboardData);
//     const text_paste_content = clipboard_data.getData('text/plain');
//     const html_paste_content = clipboard_data.getData('text/html');

//     // This what we see by default
//     console.log(text_paste_content)

//     // This is the raw HTML that can be used to make "rich" content
//     console.log(html_paste_content)
// });
  return html`
  <textarea></textarea>
    <div>Nice!<//>
    <button>Paste</button>
  `;
}

function cleanHTML(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const allElements = doc.getElementsByTagName('*');

  for (let i = 0; i < allElements.length; i++) {
      const attributes = allElements[i].attributes;
      for (let j = attributes.length - 1; j >= 0; j--) {
          allElements[i].removeAttribute(attributes[j].name);
      }
  }

  // Returns the body's innerHTML which should now be cleaner
  return doc.body.innerHTML;
}

function refineHTML(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Function to determine if an element is effectively empty
  function isEmptyElement(element) {
      return !element.textContent.trim() && element.children.length === 0;
  }

  // Function to remove unnecessary elements but keep their children
  function flattenElement(element) {
      const parent = element.parentNode;
      while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
  }

  // Collect all elements for processing
  const allElements = Array.from(doc.body.getElementsByTagName('*'));

  allElements.forEach(element => {
      // Remove empty elements
      if (isEmptyElement(element)) {
          element.parentNode.removeChild(element);
      }
      // Flatten unnecessary divs and spans that do not contribute to layout
      else if ((element.tagName === 'DIV' || element.tagName === 'SPAN') && element.attributes.length === 0) {
          flattenElement(element);
      }
  });

  return doc.body.innerHTML;
}

export default async function init(el) {
  const editor = createTag('div', { id: 'editor' });
  await loadScript('https://cdn.ckeditor.com/ckeditor5/41.2.1/classic/ckeditor.js');
  el.append(editor);
  // eslint-disable-next-line no-undef
  ClassicEditor.create(editor).catch((error) => {
    console.error(error);
  });
  render(html`<${Container} />`, el);
  // el.querySelector('button').addEventListener('click', () => {
  //   navigator.clipboard.read()
  //     .then((items) => {
  //       console.log(items);
  //       items.forEach((item, i) => {
  //         item.getType('text/html').then((blob) => {
  //           blob.text().then((text) => {
  //             console.log(text);
  //             console.log('after cleaning:');
  //             console.log(cleanHTML(text));
  //             console.log('after refining:');
  //             console.log(refineHTML(text));
  //           });
  //         });
  //       });
  //     });
  // });
}
