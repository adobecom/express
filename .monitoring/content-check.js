/* global $browser $driver */
/* eslint-disable no-console */

/*
 * Scripted Browser API Documentation:
 * https://docs.newrelic.com/docs/synthetics/new-relic-synthetics/scripting-monitors/writing-scripted-browsers
 */
const assert = require('assert');

const baseUrl = '$$$URL$$$';
const TIMEOUT = 5000;

/**
 * Checks if the homepage and pricing page are loading and showing the expected content.
 * @param {string} homeUrl The homepage URL to check
 */
async function checkContent(homeUrl) {
  return $browser.get(homeUrl)
    .then(() => console.log('Verifying homepage...'))
    // wait for the page to fully load
    .then(() => $browser.sleep(TIMEOUT))
    // check CTA button
    .then(() => $browser.findElement($driver.By.css('main a.button.accent')))
    .then((button) => button.getAttribute('href'))
    .then((ctaUrl) => assert.equal(new URL(ctaUrl).origin, 'https://adobesparkpost.app.link', `Unexpected CTA button URL: ${ctaUrl}`))
    .then(() => console.log('CTA button OK'))
    .then(() => console.log('Homepage successfully verified.'))
    // pricing page
    .then(() => $browser.get(`${homeUrl}pricing`))
    .then(() => console.log('Verifying pricing page...'))
    // wait for the page to fully load
    .then(() => $browser.sleep(TIMEOUT))
    // check buy button
    .then(() => $browser.findElements($driver.By.css('main a.button')))
    .then((buttons) => buttons[0].getAttribute('href'))
    .then((buyUrl) => assert.equal(new URL(buyUrl).origin, 'https://commerce.adobe.com', `Unexpected buy button URL: ${buyUrl}`))
    .then(() => console.log('Buy button OK'))
    // // check free button
    // .then(() => $browser.findElements($driver.By.css('main a.button.reverse')))
    // .then((buttons) => buttons[0].getAttribute('href'))
    // .then((freeUrl) => assert.equal(new URL(freeUrl).origin, 'https://express.adobe.com', `Unexpected free button URL: ${freeUrl}`))
    // .then(() => console.log('Free button OK'))
    .then(() => console.log('Pricing page successfully verified.'))
    .catch((e) => {
      assert.fail(`Verification failed: ${e.message}`);
    });
}

// Check homepage and pricing page
(async () => {
  await checkContent(baseUrl);
})();