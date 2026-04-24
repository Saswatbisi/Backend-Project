# Day 17: Optimization, Segmentation & Automation

## Objective
Handle CPU-intensive tasks without blocking the main Event Loop using the `worker_threads` module.

## Implementation Details
We created a new script `heavy_task.js` that demonstrates splitting a CPU-bound task (calculating a Fibonacci sequence) across a separate thread so that the Main Thread remains highly responsive to incoming API requests or other I/O operations.

- **CPU Offloading**: Instantiated a `Worker` to move the Fibonacci calculation out of the Event Loop.
- **Event Loop Integrity**: Displayed a `console.log` immediately on the Main Thread, proving the Event Loop isn't blocked.
- **Worker Logic**: Deployed a recursive thread-safe Fibonacci calculator.
- **Thread Communication**: Handled two-way data transfer via `workerData` down to the worker, and `parentPort.postMessage` / `worker.on('message')` back up to the Main Thread.

## Performance Test Reflection
**Q: In MeetMux, name one specific feature that should be handled by a worker thread.**
**A:** In MeetMux, generating PDF Tickets for newly registered activities/events is a notoriously CPU-intensive task. It involves parsing HTML, rendering layout engines, and streaming graphics to PDF. By offloading PDF rendering to a `worker_threads` instance, the Main Thread can instantly respond to the user's registration POST request, while the PDF is safely built in the background and emailed upon completion.

**(Note: Another excellent example for a media app like MeetMux is video/audio transcoding or processing bulk password hash updates.)**

## Final Completion Checklist
- [x] Successfully implemented a `Worker` instance.
- [x] Passed data to the worker using `workerData`.
- [x] Received results back in the main thread via `on('message')`.
- [x] Verified that the main thread's `console.log` executes before the worker finishes.
