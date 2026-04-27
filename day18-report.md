# WebSocket Scaling Reflection

**Question 1:** If MeetMux scales to 1 million simultaneous users, why might a single Node.js server struggle to keep all those WebSocket connections open?

**Answer:** 
A single Node.js server struggles to hold 1 million simultaneous WebSocket connections primarily due to resource limits. 
1. **Memory Exhaustion:** Each open socket requires a small amount of memory to maintain the persistent connection state. Scaling to a million sockets would quickly exceed the RAM available on an average single server instance.
2. **Event Loop Bottleneck:** Node.js runs on a single-threaded Event Loop. Broadcasting events or managing thousands of I/O operations simultaneously would block the Event Loop, causing extreme latency and connection drops.
3. **File Descriptors Limit:** Operating systems limit the number of open file descriptors (and hence active network connections) per process. Supporting 1 million concurrent connections on a single machine requires heavily tuned OS configurations that go far beyond default constraints.

**Question 2:** How would a 'Pub/Sub' system like Redis help here?

**Answer:** 
A Pub/Sub (Publish/Subscribe) system like Redis allows the backend to scale horizontally across multiple Node.js servers rather than forcing 1 million users onto one bottlenecked server.
1. **Decentralization:** You can run many smaller Node server instances behind a load balancer, each handling a manageable amount of WebSocket connections (e.g., 50 instances handling 20k sockets each).
2. **Central Broker:** Redis acts as the central communication bridge between these separate servers. If User A on Server 1 wants to message User B on Server 2, Server 1 "Publishes" an event to Redis. Server 2 "Subscribes" to the channel, receives the event almost instantly, and pushes it to User B. The `@socket.io/redis-adapter` natively handles passing messages back and forth so connected users appear to be sharing the same server instance.
