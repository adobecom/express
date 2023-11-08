/* eslint-disable no-console */
/* global $http $util */
/*
 * Synthetics API Test Documentation:
 * https://docs.newrelic.com/docs/synthetics/new-relic-synthetics/scripting-monitors/write-synthetics-api-tests
 */
const assert = require('assert');

// $http -> https://github.com/request/request
$http.get({
  url: '$$$URL$$$',
},
// callback
(err, response) => {
  if (err) {
    $util.insights.set('error', err);
    console.error(err);
  }
  assert.equal(response.statusCode, 200, `Expected a 200 OK response, got ${response.statusCode}`);
});
