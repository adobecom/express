/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable no-console */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../../../express/scripts/lana.js';

const defaultTestOptions = {
  clientId: 'testClientId',
  endpoint: 'https://lana.adobeio.com/',
  errorType: 'e',
  sampleRate: 100,
  implicitSampleRate: 100,
};

let xhr;
let xhrRequests;

it('verify default options', () => {
  expect(window.lana.options).to.be.eql({
    clientId: '',
    endpoint: 'https://www.adobe.com/lana/ll',
    endpointStage: 'https://www.stage.adobe.com/lana/ll',
    errorType: 'e',
    sampleRate: 1,
    tags: '',
    implicitSampleRate: 1,
    useProd: true,
  });
});

describe('LANA', () => {
  beforeEach(() => {
    xhr = sinon.useFakeXMLHttpRequest();
    xhrRequests = [];
    xhr.onCreate = function oncreate(req) {
      xhrRequests.push(req);
    };

    window.lana.options = { ...defaultTestOptions };
    window.lana.debug = false;
    window.lana.localhost = false;
    sinon.spy(console, 'log');
    sinon.spy(console, 'warn');
  });

  afterEach(() => {
    console.log.restore();
    console.warn.restore();
    xhr.restore();
  });

  it('Exists on the window object', () => {
    expect(window.lana).to.exist;
  });

  it('Catches unhandled error', (done) => {
    const testCallback = () => {
      window.removeEventListener('unhandledrejection', testCallback);
      expect(xhrRequests.length).to.equal(1);
      expect(xhrRequests[0].method).to.equal('GET');
      expect(xhrRequests[0].url.indexOf('https://www.stage.adobe.com/lana/ll?m=Promise%20Rejection%20stack%3A%20undefined%20lineno%3A%20undefined%20filename%3A%20undefined&c=testClientId&s=100&t=i') === 0).to.be.true;
      done();
    };
    window.addEventListener('unhandledrejection', testCallback);
    /* eslint-disable-next-line prefer-promise-reject-errors */
    Promise.reject('Promise Rejection');
  });

  it('Catches errors without a message', (done) => {
    const testCallback = () => {
      window.removeEventListener('unhandledrejection', testCallback);
      expect(xhrRequests.length).to.equal(1);
      expect(xhrRequests[0].method).to.equal('GET');
      expect(xhrRequests[0].url).to.equal(
        'https://www.stage.adobe.com/lana/ll?m=undefined%20stack%3A%20undefined%20lineno%3A%20undefined%20filename%3A%20undefined&c=testClientId&s=100&t=i',
      );
      done();
    };
    window.addEventListener('unhandledrejection', testCallback);
    /* eslint-disable-next-line prefer-promise-reject-errors */
    Promise.reject();
  });

  it('Will truncate the message', () => {
    const longMsg = 'm'.repeat(2100);
    const expectedMsg = `${'m'.repeat(2000)}%3Ctrunc%3E`;
    window.lana.log(longMsg);
    expect(xhrRequests.length).to.equal(1);
    expect(xhrRequests[0].method).to.equal('GET');
    expect(xhrRequests[0].url).to.equal(
      `https://www.stage.adobe.com/lana/ll?m=${expectedMsg}&c=testClientId&s=100&t=e`,
    );
  });

  it('Consoles data when debug mode is enabled', (done) => {
    window.lana.debug = true;
    window.lana.log('Test debug log message', { clientId: 'debugClientId' });
    const serverResponse = 'client=debugClientId,type=e,sample=1,user-agent=Mozilla/5.0 '
      + '(Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) '
      + 'Chrome/101.0.4951.54 Safari/537.36,referer=undefined,ip=23.56.175.228,message=Test debug log message';
    xhrRequests[0].respond(200, { 'Content-Type': 'text/html' }, serverResponse);

    setTimeout(() => {
      expect(console.log.args[0]).to.eql([
        'LANA Msg: ',
        'Test debug log message',
        '\nOpts:',
        {
          clientId: 'debugClientId',
          endpoint: 'https://lana.adobeio.com/',
          endpointStage: 'https://www.stage.adobe.com/lana/ll',
          errorType: 'e',
          implicitSampleRate: 100,
          sampleRate: 100,
          tags: '',
          useProd: true,
        },
      ]);
      expect(console.log.args[1]).to.eql(['LANA response:', serverResponse]);
      done();
    }, 50);
  });

  it('Consoles data when localhost mode is enabled', () => {
    window.lana.localhost = true;
    window.lana.log('Test localhost log message');
    expect(console.log.args[0]).to.eql([
      'LANA Msg: ',
      'Test localhost log message',
      '\nOpts:',
      {
        clientId: 'testClientId',
        endpoint: 'https://lana.adobeio.com/',
        endpointStage: 'https://www.stage.adobe.com/lana/ll',
        errorType: 'e',
        implicitSampleRate: 100,
        sampleRate: 100,
        tags: '',
        useProd: true,
      },
    ]);

    // when in localhost mode, nothing is sent to the server
    expect(xhrRequests.length).to.equal(0);
  });

  it('warns that clientId is not set', () => {
    window.lana.options.clientId = '';
    window.lana.log('Test log message');
    expect(console.warn.args[0][0]).to.eql('LANA ClientID is not set in options.');
  });

  it('sets tags if defined in options', () => {
    window.lana.log('I set the client id', { tags: 'commerce,pricestore' });
    expect(xhrRequests.length).to.equal(1);
    expect(xhrRequests[0].method).to.equal('GET');
    expect(xhrRequests[0].url).to.equal(
      'https://www.stage.adobe.com/lana/ll?m=I%20set%20the%20client%20id&c=testClientId&s=100&t=e&tags=commerce,pricestore',
    );
  });

  it('uses default option values if not set in options object', () => {
    window.lana.options = {
      clientId: 'blah',
      sampleRate: 100,
      implicitSampleRate: 100,
    };
    window.lana.log('only the clientId set in window.lana.options');
    expect(xhrRequests.length).to.equal(1);
    expect(xhrRequests[0].method).to.equal('GET');
    expect(xhrRequests[0].url).to.equal(
      'https://www.stage.adobe.com/lana/ll?m=only%20the%20clientId%20set%20in%20window.lana.options&c=blah&s=100&t=e',
    );
  });
});
