# Day 19 Track Objectives: Redis Caching and Performance

## Reflection Question

**If MeetMux has a live 'Trending Now' list that changes every minute, would you set the Redis TTL to 10 seconds or 1 hour? Explain your choice based on the balance between speed and data accuracy.**

**Answer:**
A TTL of 10 seconds is the right choice in this scenario.

**Reasoning:**
- **Data Accuracy (Staleness):** Since the list is expected to change every minute, a 1-hour TTL would be detrimental. It would mean that a user could potentially see a "Trending Now" list that is up to 59 minutes out of date. This ruins the "live" experience expected by the user.
- **Speed and Load (Performance):** While a 1-hour TTL would result in fewer database hits over time, a 10-second TTL still offers massive performance benefits. In a high-traffic application, thousands of users might hit the "Trending Now" endpoint within those 10 seconds. Serving those from the in-memory cache drastically reduces the database load compared to querying the DB on every single request.
- **Balance:** A 10-second TTL perfectly balances the need for speed with the requirement for relatively fresh data. It acts as a shield against rapid, consecutive queries (thundering herd problem) while ensuring that the data displayed is never more than 10 seconds old.

## Final Completion Checklist
- [x] Successfully connected a Node.js application to a local Redis instance.
- [x] Implemented a Cache-Aside pattern (Check cache -> Query DB -> Update cache).
- [x] Used `setEx` to set a Time To Live (TTL) on cached items.
- [x] Successfully used the `del` command to manually invalidate a specific cache key.
