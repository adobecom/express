onmessage = (e) => {
  const startTime = performance.now();
  const input = e.data;
  const numsArr = Array.from({ length: input + 1 }, () => true);

  const primeNumbers = [];
  for (let i = 2; i <= input; i += 1) {
    if (numsArr[i]) {
      primeNumbers.push(i);

      for (let j = i + i; j <= input; j += i) {
        numsArr[j] = false;
      }
    }
  }
  const endTime = performance.now();
  postMessage(endTime - startTime);
};
