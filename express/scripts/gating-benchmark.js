onmessage = (e) => {
  const startTime = performance.now();
  const iterations = e.data; // Adjust the number for different execution time
  let result = 0;
  for (let i = 0; i < iterations; i += 1) {
    // eslint-disable-next-line no-unused-vars
    result += Math.random() * Math.random();
  }

  const endTime = performance.now();
  postMessage(endTime - startTime);
};
