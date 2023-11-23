onmessage = function(e) {
    const imageData = e.data.imageData;
    createBlobFromImageData(imageData).then(blob => {
        self.postMessage({ blob });
    }).catch(() => {
        self.postMessage({ status: 'error' });
    });
};

function createBlobFromImageData(imageData) {
    return new Promise((resolve, reject) => {
        const offscreenCanvas = new OffscreenCanvas(imageData.width, imageData.height);
        const ctx = offscreenCanvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);

        offscreenCanvas.convertToBlob().then(blob => {
        resolve(blob);
        }).catch(reject);
    });
}