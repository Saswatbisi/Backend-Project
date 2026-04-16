const { parentPort, workerData } = require('worker_threads');

// Simulate a heavy computation
let result = 0;
for (let i = 0; i < workerData.iterations; i++) {
  result += i;
}

// Send the result back to the main thread
parentPort.postMessage(result);
