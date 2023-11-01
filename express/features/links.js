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

let fetched = false;
let linkData = null;

const getLinks = async (path) => {
  if (!path) return null;
  if (!fetched) {
    const resp = await fetch(path);
    if (resp.ok) {
      const json = await resp.json();
      linkData = json.data;
    }
    fetched = true;
}
  return linkData;
};

export default async function init(path, area = document) {
  const data = await getLinks(path);
  if (!data) return;
  const links = area.querySelectorAll('a:not([href^="/"])');
  [...links].forEach((link) => {
    data.filter((s) => link.href.startsWith(s.domain))
      .forEach((s) => {
        if (s.rel) link.setAttribute('rel', s.rel);
        if (s.window) link.setAttribute('target', s.window);
      });
  });
}
