/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
async function fetchAsync(url) {
  const response = await fetch(url);
  return response.json();
}

(async function crawlQAUrls() {
  const qualityAssuranceSheet = await fetch('/drafts/qiyundai/book.json?limit=99999').then((resp) => resp.json());
  const output = {
    data: [],
  };

  // qualityAssuranceSheet.data.forEach((r, i) => {
  //   output.data.push({
  //     url: r['Original Url'],
  //     response: fetchAsync(r['Original Url']),
  //   });
  //
  //   console.log(output.data[i].url, output.data[i].response);
  // });
}());
