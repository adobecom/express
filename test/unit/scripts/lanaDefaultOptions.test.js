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
import { expect } from '@esm-bundle/chai';

const defaultTestOptions = {
  clientId: 'testClientId',
  endpoint: 'https://lana.adobeio.com/',
  errorType: 'e',
  sampleRate: 100,
  tags: '',
  implicitSampleRate: 100,
};

it('lana should load existing window.lana.options', async () => {
  window.lana = { options: defaultTestOptions };
  await import('../../../express/scripts/lana.js');

  expect(window.lana.options).to.be.eql({
    clientId: 'testClientId',
    endpoint: 'https://lana.adobeio.com/',
    errorType: 'e',
    sampleRate: 100,
    tags: '',
    implicitSampleRate: 100,
    endpointStage: 'https://www.stage.adobe.com/lana/ll',
    useProd: true,
  });
});
