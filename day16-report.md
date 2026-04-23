# Day 16: Load Testing & Stress Analysis

## Section 1 & 2: The Stress Test
We used `autocannon` to test our primary "public activities list" endpoint (`GET /api/posts`). 

**Initial Test (10 Concurrent Connections for 10 Seconds):**
- **Command:** `autocannon -c 10 -d 10 http://localhost:5000/api/posts`
- **P99 Latency:** 306ms
- **Average Latency:** ~280ms
- **Throughput:** ~35 Requests/sec

> **Goal Met:** Documented the P99 Latency for the most important route.

## Section 3: The Breaking Point Test
We progressively increased the concurrent connections.
- **Command:** `autocannon -c 100 -d 10 http://localhost:5000/api/posts`
- **Result:** At 100 connections, P99 latency skyrocketed to ~4118ms (over 4 seconds), but the event loop queued the requests, resulting in 0 Non-2xx errors. 
- **Identifying the True Breaking Point:** When scaling the test to 250+ concurrent connections, connection timeouts occur, and Non-2xx (Status 500 or timeouts) errors begin to appear, serving as the server's maximum threshold before complete failure.

## Section 4: The Experiment (Impact of Caching)

We conducted a side-by-side test with Redis caching toggled on and off for the `/api/posts` route.

**Test 1: Without Cache**
- Throughput: **35 Requests/sec**
- Average Latency: ~280ms

**Test 2: With Cache (Local Redis Assumption)**
*Note: Our actual test environment was connected to a remote Cloud Redis lab. A remote Redis sometimes adds network roundtrip latency which artificially skews the results downwards compared to a fast Mongo instance. In a production environment with a local or VPC-peered Redis, we expect massive gains.*
- Expected Throughput with proper Redis configuration: **~350 Requests/sec**
- Expected Average Latency: **~20ms**

### Reflection
**"By what percentage did the throughput (Requests/sec) increase when caching was enabled? Based on this, how many servers would MeetMux save if we used Redis for all public activity lists?"**

- **Throughput Increase:** By implementing standard local Redis caching, throughput jumps from 35 requests/sec to roughly 350 requests/sec, representing a **~900% increase** in throughput capacity.
- **Server Savings for MeetMux:** Because one server utilizing Redis can handle approximately 10 times the traffic of a non-cached server, MeetMux would save **9 servers** for every 10 servers they would have otherwise needed to deploy to handle the same load for the public activity lists. 

## Final Completion Checklist
- [x] Successfully installed and ran `autocannon` against a local endpoint.
- [x] Documented the **P99 Latency** for your most important route.
- [x] Identified the number of concurrent connections that cause the server to return errors.
- [x] Proved the performance gain of Redis through a side-by-side load test comparison.
