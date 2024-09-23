Feature: Check Important Express Pages

@smoke-test
  Scenario: Verify that all URLs return a valid status code
    Given a list of URLs
    When I check each URL
    Then there should be no 404 status codes

  Examples:
    | URL              |
    | #                |
    | templates/flyer  |
    | create/menu      |