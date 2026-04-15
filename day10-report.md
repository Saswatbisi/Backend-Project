# Day 10: Real-Time with Socket.io

## Reflection

**Question:** Why would using WebSockets be better for a 'Live Matchmaking' feature on MeetMux compared to having the app refresh every 5 seconds?

**Answer:**
Using WebSockets is vastly superior to a 5-second refresh interval (short polling) for Live Matchmaking due to the following reasons:

1. **Instant Updates & Low Latency**: WebSockets provide a persistent, full-duplex connection. When a match is found, the server can instantly *push* the data to the client, leading to a seamless real-time experience, whereas an HTTP poll might mean the user has to wait up to 5 seconds to get the update.
2. **Lower Server Overhead**: Refreshing every 5 seconds means clients are constantly sending HTTP requests and the server is constantly resolving them (including TLS handshakes, HTTP parsing, routing, and header overhead). With WebSockets, an initial connection is made and stays open, heavily reducing server strain especially with thousands of active users in the matchmaking pool.
3. **Bidirectional Communication**: With a WebSocket, both the server and client can push messages to each other whenever needed without waiting for the client to ask. In matchmaking, clients can broadcast subtle state changes (like "canceling search" or "accepting match") instantly.
4. **Better User Experience**: Constant HTTP polling can lead to clunky UI updates and battery drain on mobile devices. A WebSocket manages network resources much more efficiently for long-running stateful features.
