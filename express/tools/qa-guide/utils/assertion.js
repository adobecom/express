const assert = {
  find: (target, expected) => {
    const elementFound = document.querySelector(target) !== undefined;
    return elementFound.toString() === expected;
  },
  count: (target, expected) => {
    const numberFound = document.querySelectorAll(target).length.toString();
    return numberFound === expected;
  },
  min: (target, expected) => {
    const numberFound = document.querySelectorAll(target).length.toString();
    return numberFound >= expected;
  },
  max: (target, expected) => {
    const numberFound = document.querySelectorAll(target).length.toString();
    return numberFound <= expected;
  },
};

export default function runAssertions(checkbox, item) {
  const assertionResults = item.assertions.map((str) => {
    const [method, selector, expect] = str.split('::');

    if (!assert[method.toLowerCase()]) return false;

    return assert[method.toLowerCase()](selector, expect);
  });

  checkbox.checked = assertionResults.every((assertionTrue) => assertionTrue);

  if (checkbox.checked) {
    checkbox.disabled = true;
    checkbox.parentElement.classList.add('auto-asserted--success');
  } else {
    checkbox.parentElement.classList.add('auto-asserted--fail');
  }
}
