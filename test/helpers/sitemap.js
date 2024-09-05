const fetch = require('node-fetch');
/* eslint-disable-next-line import/no-unresolved */
const dotenv = require('dotenv');

dotenv.config();
const urls = [
  'https://www.adobe.com/express/sitemap.xml',
  'https://www.adobe.com/express/templates/sitemap.xml',
  'https://www.adobe.com/express/colors/sitemap.xml',
  'https://www.adobe.com/express/blog/sitemap.xml',

];

const apiKey = process.env.HELIX_API_KEY;
if (!apiKey) {
  throw new Error(`Invalid API Key: ${apiKey}`);
}

async function makeRequests() {
  const baseURL = 'https://admin.hlx.page/sitemap/adobecom/express/stage/';
  const failedURLs = [];
  await Promise.all(urls.map(async (url) => {
    try {
      const parsedURL = url.split('https://www.adobe.com/')[1];
      const response = await fetch(baseURL + parsedURL, {
        method: 'POST',
        headers: {
          authorization: `token ${apiKey}`,
        },
      });
      if (response.status !== 200) {
        /* eslint-disable*/
        console.error(`Error: ${url}`, response.statusText);
        failedURLs.push(url);
      } else {
        const data = await response.text();
        /* eslint-disable*/
        console.log(`Success: ${url}`, data);
      }
    } catch (error) {
      console.log(error);
      failedURLs.push(url);
    }
  }))
  if (failedURLs.length > 0) {
    /* eslint-disable*/
    console.error('------------');
    /* eslint-disable*/
    console.error('Failed to build some urls');
    for (const url of failedURLs) {
      /* eslint-disable*/
      console.error(url);
    }
    /* eslint-disable*/
    console.error('------------');
    throw new Error('Failed to rebuild some urls');
  }
}

makeRequests().catch((e) => console.error(e))
