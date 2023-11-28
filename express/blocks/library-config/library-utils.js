export default function createCopy(blob) {
  // eslint-disable-next-line no-undef
  const data = [new ClipboardItem({ [blob.type]: blob })];
  navigator.clipboard.write(data);
}
