const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // Main Thread: API remains responsive
  const worker = new Worker(__filename, { workerData: 40 });

  worker.on('message', (result) => {
    console.log(`Calculation Finished: ${result}`);
  });

  console.log("Main Thread is free to handle other requests!");
} else {
  // Worker Thread: Heavy lifting
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
  parentPort.postMessage(fibonacci(workerData));
}
