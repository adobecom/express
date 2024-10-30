import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

import sinon from 'sinon';
import { mockRes } from '../test-utilities.js';

import { setConfig, createTag } from '../../../express/scripts/utils.js';

setConfig({ locales: { '': { ietf: 'en-US', tk: 'jdq5hay.css' } } });

const {
  default: init, runQuickAction,
} = await import('../../../express/blocks/frictionless-quick-action/frictionless-quick-action.js');

document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
const ogFetch = window.fetch;

describe('Frictionless Quick Action Block', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('initializes correctly', async () => {
    window.fetch = sinon.stub().callsFake(() => mockRes({
      payload: {
        data: [
          {
            Key: 'free-plan-check-1',
            Text: 'Free use forever',
          },
          {
            Key: 'free-plan-check-2',
            Text: 'No credit card required',
          },
        ],
      },
    }));
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });

    const block = document.body.querySelector('.frictionless-quick-action');

    await init(block);

    const title = block.querySelector(':scope h1');
    const text = block.querySelector('div:nth-child(1) p');
    expect(title).to.not.be.null;
    expect(title.textContent).to.be.equal('Crop your image for free.');
    expect(text).to.not.be.null;
    expect(text.textContent).to.be.equal('The online Crop image tool from Adobe Express transforms your images into the perfect size in seconds.');

    const video = block.querySelector('div:nth-child(2) > div:nth-child(1) video');
    expect(video).to.not.be.null;

    const dropzone = block.querySelector('div:nth-child(2) > div:nth-child(2) .dropzone');
    const dropzoneTitle = dropzone.querySelector(':scope > h4');
    expect(dropzoneTitle.textContent).to.be.equal('Drag and drop an image or browse to upload.');

    const freePlanTexts = dropzone.querySelectorAll(':scope .plan-widget-tag');
    expect(freePlanTexts.length).to.be.equal(2);

    window.fetch = ogFetch;
  });

  it('sdk loads other components', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
    const block = document.body.querySelector('.frictionless-quick-action');

    runQuickAction('convert-to-jpg', 'data:image/png;base64,', block);
    const qac = block.querySelector('.quick-action-container');
    expect(qac).to.not.be.null;
  });

  it('should test showErrorToast', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
    const block = document.body.querySelector('.frictionless-quick-action');
    await init(block);

    const oversizedFile = new File([new ArrayBuffer(50 * 1024 * 1024)], 'test.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(oversizedFile);

    const dropEvent = new DragEvent('drop', { dataTransfer });

    const dropzoneContainer = block.querySelector(':scope .dropzone-container');
    dropzoneContainer.dispatchEvent(dropEvent);

    await new Promise((resolve) => {
      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList') {
            const errorToast = document.querySelector('.error-toast');
            if (errorToast) {
              observer.disconnect();
              resolve();
            }
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });

    const errorToast = document.querySelector('.error-toast');
    expect(errorToast).to.not.be.null;
    expect(errorToast.textContent).to.include('File size not supported');
  });
  it('handles popstate event correctly', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
    const block = document.body.querySelector('.frictionless-quick-action');
    await init(block);

    const quickActionContainer = document.createElement('div');
    quickActionContainer.classList.add('quick-action-container');
    block.append(quickActionContainer);

    const uploadContainer = document.createElement('div');
    uploadContainer.classList.add('hidden');
    block.append(uploadContainer);

    const event = new PopStateEvent('popstate', { state: { hideFrictionlessQa: true } });

    window.dispatchEvent(event);

    expect(uploadContainer.classList.contains('hidden')).to.be.true;
  });

  it('should handle dropzone container', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
    const block = document.body.querySelector('.frictionless-quick-action');
    await init(block);

    const dropzoneContainer = block.querySelector('.dropzone-container');
    const inputClickStub = sinon.stub(block.querySelector('input[type="file"]'), 'click');

    const event = new MouseEvent('click');
    dropzoneContainer.dispatchEvent(event);

    const dragenterEvent = new Event('dragenter');
    dropzoneContainer.dispatchEvent(dragenterEvent);

    expect(dropzoneContainer.classList.contains('highlight')).to.be.true;
    expect(inputClickStub.calledOnce).to.be.true;

    inputClickStub.restore();
  });

  it('should handle click on dropzone container and trigger input click', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
    const block = document.body.querySelector('.frictionless-quick-action');
    await init(block);

    const dropzoneContainer = block.querySelector('.dropzone-container');
    const inputElement = block.querySelector('input[type="file"]');

    const inputClickStub = sinon.stub(inputElement, 'click');

    dropzoneContainer.dispatchEvent(new MouseEvent('click'));

    expect(inputClickStub.calledOnce).to.be.true;

    inputClickStub.restore();
  });

  it('should add the metadata and test if the logo got added', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
    const block = document.body.querySelector('.frictionless-quick-action');

    const meta = createTag('meta', { name: 'marquee-inject-logo', content: 'on' });
    document.head.append(meta);

    await init(block);

    expect(block.querySelector('.express-logo')).to.not.be.null;

    meta.remove();
  });

  it('sdk starts on file drop', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
    const block = document.body.querySelector('.frictionless-quick-action');
    await init(block);

    const dropzoneContainer = block.querySelector(':scope .dropzone-container');
    const file = new File([''], 'test', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const event = new DragEvent('drop', { dataTransfer });
    const callback = function cb(mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === 'SCRIPT') {
              const script = document.querySelector('head > script[src="https://sdk.cc-embed.adobe.com/v3/CCEverywhere.js"]');
              expect(script).to.not.be.null;
              observer.disconnect();
            }
          });
        }
      }
    };
    const observer = new MutationObserver(callback);
    observer.observe(document.head, { childList: true, subtree: true });

    dropzoneContainer.dispatchEvent(event);
  });
});
