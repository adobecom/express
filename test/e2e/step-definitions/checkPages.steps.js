import { Given, When, Then } from '@cucumber/cucumber';

const playwright = require('playwright');
const YAML = require('yamljs');
const assert = require('assert');

const { urls } = YAML.load('./test/e2e/urls.yml');

const responseCodes = [];

Given('a list of URLs', () => {
  assert(urls.length > 0, 'No URLs found in the YAML file.');
});

When('I check each URL', async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();

  for (const url of urls) {
    const response = await context.request.get(url);
    const statusCode = response.status();
    responseCodes.push({ url, statusCode });
  }
  await browser.close();
});

Then('there should be no 404 status codes', () => {
  responseCodes.forEach(({ url, statusCode }) => {
    assert(statusCode !== 404, `${url} returned a 404 status code`);
  });
});
