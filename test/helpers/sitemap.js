const fetch = require('node-fetch');
/* eslint-disable-next-line import/no-unresolved */
const dotenv = require('dotenv');

dotenv.config();
const urls = [
  'https://www.adobe.com/express/sitemap.xml',
];
const apiKey = process.env.HELIX_API_KEY;
if (!apiKey) {
  throw new Error(`Invalid API Key: ${apiKey}`);
}
async function makeRequests() {
  const baseURL = 'https://admin.hlx.page/sitemap/adobecom/express/stage/';
  const failedURLs = [];
  for await (const url of urls) {
    try {
      const parsedURL = url.split('https://www.adobe.com/')[1];
      const response = await fetch(baseURL + parsedURL, {
        method: 'POST',
        headers: {
          authorization: `token ${apiKey}`,
        },
      });
      if (response.status !== 200) {
        console.error(`Error: ${url}`, response.statusText);
        failedURLs.push(url);
      } else {
        const data = await response.text();
        console.log(`Success: ${url}`, data);
      }
    } catch (error) {
      console.log(error);
      failedURLs.push(url);
    }
  }
  if (failedURLs.length > 0) {
    console.error('------------');
    console.error('Failed to build some urls');
    for (const url of failedURLs) {
      console.error(url);
    }
    console.error('------------');
    throw new Error('Failed to rebuild some urls');
  }
}

makeRequests();
