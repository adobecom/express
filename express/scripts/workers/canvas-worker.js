function createBlobFromImageData(imageData) {
  return new Promise((resolve, reject) => {
    const offscreenCanvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = offscreenCanvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);

    offscreenCanvas.convertToBlob().then((blob) => {
      resolve(blob);
    }).catch(reject);
  });
}

onmessage = (e) => {
  const { imageData } = e.data;
  createBlobFromImageData(imageData).then((blob) => {
    postMessage({ blob });
  }).catch(() => {
    postMessage({ status: 'error' });
  });
};
