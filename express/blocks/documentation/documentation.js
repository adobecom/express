// Block for displaying documentation. What this does is
// display a table similar to the one in sharepoint for a list
// of elements. This can be useful if you are documenting
// the structure of a block and choose to use a table to do so
export default async function decorate(block) {
  const children = block.querySelectorAll(':scope > div');
  children.forEach((c) => {
    c.classList.add('documentation-row');
  });
}
