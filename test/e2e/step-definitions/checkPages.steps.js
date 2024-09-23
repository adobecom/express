import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from "@playwright/test";

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
  const page = await context.newPage();

  for (const url of urls) {
    try {
      const response = await page.goto(url);
      const statusCode = response.status();
      responseCodes.push({ url, statusCode });
    } catch (error) {
      responseCodes.push({ url, statusCode: 'Network error' });
    }
  }
  await browser.close();
});

Then('there should be no 404 status codes', () => {
  responseCodes.forEach(({ url, statusCode }) => {
    console.log(`${url} returned status code: ${statusCode}`);
    assert(statusCode !== 404, `${url} returned a 404 status code`);
  });
});
