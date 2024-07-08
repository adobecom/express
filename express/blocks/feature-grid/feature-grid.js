import { createTag } from '../../scripts/utils.js';
import { isVideoLink } from '../shared/video.js';

function renderImageOrVideo(media) {
  let updatedMedia;
  if (media.tagName.toUpperCase() === 'PICTURE') {
    updatedMedia = media.querySelector('img');
  } else if (!media?.href) {
    return null;
  } else if (isVideoLink(media?.href)) {
    const attributes = { class: 'hero-animation-background' };
    ['playsinline', 'autoplay', 'loop', 'muted'].forEach((p) => {
      attributes[p] = '';
    });
    updatedMedia = createTag('video', attributes);
    updatedMedia.src = media.href;
  }
  return updatedMedia;
}

function renderGridNode({
  media,
  title,
  subText,
  cta,
}, index) {
  const gridItem = createTag('a', { class: `grid-item item-${index + 1}` });
  const updatedMedia = renderImageOrVideo(media);
  gridItem.href = cta?.href;

  if (title) gridItem.append(title);
  if (subText) gridItem.append(subText);
  if (cta) {
    cta.classList.add('cta');
    cta.classList.remove('button');
    gridItem.append(cta);
  }

  if (index < 4) {
    gridItem.append(updatedMedia);
  } else {
    gridItem.prepend(updatedMedia);
  }
  return gridItem;
}

const applyProperties = (block, properties) => { 
  for (let key of Object.keys(properties)) {
    const elements = block.querySelectorAll(key)
    if (elements.length === 0) continue; 
    for (let element of elements){
      const scopeProperties = properties[key]
      let style = ''
      for (let styleKey of Object.keys(scopeProperties)){
        if (styleKey === 'textContent'){
          element.textContent = scopeProperties.textContent 
        } else {
          style += styleKey + ":" + scopeProperties[styleKey] + " "
        }
      } 
      element.style = style
    }
    
  }
}

const extractProperties = (block) => {
  let rows = Array.from(block.querySelectorAll(':scope > div')) 
  rows = rows.filter((row) =>  {
    
    return row?.children?.length === 2 && row?.children[0]?.textContent.includes("Properties") 
  })
  let allProperties = {} 
  for (let propertyRow of rows){
    const key = propertyRow.children[0].textContent
    let properties; 
    if (propertyRow.children[1].children.length === 0) {
      properties = [propertyRow.children[1]] 
    } else {
      properties = Array.from(propertyRow.children[1].querySelectorAll('p'))
    }
    let scopeProperties = {}
    for (let p of properties){
      const [k,v] = p.textContent.split(":")
      scopeProperties[k] = v
    }
    let selector = ":scope "
    let possibleKeySelector = key.split("Properties:")
    if (possibleKeySelector.length === 2)
    selector += possibleKeySelector[1]
    allProperties[selector] = scopeProperties
    block.removeChild(propertyRow)
  } 
  return allProperties
}

const decorateLoadMoreSection = (block) => {
  const loadMoreWrapper = createTag('div', { class: 'load-more-div' });
  const loadMoreButton = createTag('button', { class: 'load-more-button' });
  const loadMoreText = createTag('span', { class: 'load-more-text' });
  const toggleChev = createTag('div', { class: 'load-more-chev' });
 
  loadMoreButton.append("Load More", toggleChev); 
  loadMoreWrapper.append(loadMoreButton);
  block.append(loadMoreWrapper); 
  loadMoreButton.addEventListener('click', () => {
    block.classList.toggle('expanded');
    if (block.classList.contains('expanded')) {
      [, loadMoreText.textContent] ="Load More"
    } else {
      [loadMoreText.textContent] ="Load More"
    }
  });
};
 

export default function decorate(block) {
  const properties = extractProperties(block)

  const inputRows = block.querySelectorAll(':scope > div > div');

  block.innerHTML = '';
  const rows = Array.from(inputRows);
  const heading = rows.shift(); 
  
  const gridProps = rows.map((row) => { 
    const subText = row.querySelector('p');
    const media = row.querySelector('p:last-of-type > a, p:last-of-type > picture');
    const title = row.querySelector('h2');
    const cta = row.querySelector('a');
    return {
      media,
      title,
      subText,
      cta,
    };
  });

  if (gridProps.length > 12) {
    throw new Error(
      `Authoring issue: Feature Grid Fixed block should have 12 children. Received: ${gridProps.length}`,
    );
  }

  const gridContainer = createTag('div', { class: 'grid-container' });
  const gridItems = gridProps.map((props, index) => renderGridNode(props, index));
  heading.classList.add('heading');

  gridItems.forEach((gridItem) => {
    gridContainer.append(gridItem);
  });

  block.append(heading, gridContainer);

 // if (gridProps.length > 4) {
    decorateLoadMoreSection(block);
 // }

 applyProperties(block, properties)
}
