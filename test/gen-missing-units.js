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

// this script will find all blocks in the express/blocks folder that are missing unit tests
// and create a unit test folder and an initial .test.js for them
// so that blocks without unit tests will be included in coverage reports
const fs = require('fs');
const path = require('path');

async function main() {
  const blocksFolder = path.join(__dirname, '../express/blocks');
  // for every block
  const blocks = [];
  fs.readdirSync(blocksFolder).forEach((name) => {
    if (name === 'shared') {
      // TODO: we need to move shared to scripts in the future
      return;
    }
    const blockPath = path.join(blocksFolder, name);
    if (fs.statSync(blockPath).isDirectory()) {
      blocks.push(name);
    }
  });

  const blockUnitFolder = path.join(__dirname, '/unit/blocks');
  const blockUnits = [];
  fs.readdirSync(blockUnitFolder).forEach((name) => {
    const blockUnitPath = path.join(blockUnitFolder, name);
    if (fs.statSync(blockUnitPath).isDirectory() && fs.readdirSync(blockUnitPath).length > 0) {
      blockUnits.push(name);
    }
  });
  const missing = [];
  for (const block of blocks) {
    if (!blockUnits.includes(block)) {
      missing.push(block);
    }
  }
  console.log(missing);

  for (const block of missing) {
    const blockPath = path.join(blockUnitFolder, block);
    if (!fs.existsSync(blockPath)) fs.mkdirSync(blockPath);
    const testPath = path.join(blockPath, `${block}.test.js`);
    console.log('generating test file', testPath);
    fs.writeFileSync(
      testPath,
      `/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-env mocha */
/* eslint-disable no-unused-vars */

const { default: decorate } = await import('../../../../express/blocks/${block}/${block}.js');\n`,
    );
  }
}

main().catch(console.error);
