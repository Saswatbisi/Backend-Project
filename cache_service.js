const redis = require('redis');
const client = redis.createClient();

client.on('error', (err) => console.log('Redis Client Error', err));

async function getActivities() {
    if (!client.isOpen) {
        await client.connect();
    }

    const cacheKey = 'popular_activities';

    // 1. Try to get data from Redis
    const cachedData = await client.get(cacheKey);

    if (cachedData) {
        console.log('Cache Hit! Returning data from Redis...');
        return JSON.parse(cachedData);
    }

    // 2. Cache Miss: Simulate a slow Database Query
    console.log('Cache Miss. Fetching from Database...');
    const dbData = [
        { id: 1, name: 'Mountain Hiking' },
        { id: 2, name: 'Tech Networking' }
    ];

    // 3. Save to Redis with an Expiry (TTL) of 60 seconds
    await client.setEx(cacheKey, 60, JSON.stringify(dbData));

    return dbData;
}

async function updateActivity(id, newName) {
    if (!client.isOpen) {
        await client.connect();
    }
    // 1. Update Database (simulated)
    console.log(`Updated activity ${id} to ${newName}`);

    // 2. Invalidate Cache so the next request gets fresh data
    await client.del('popular_activities');
    console.log('Cache invalidated for popular_activities');
}

// Experiment Execution
async function runExperiment() {
    try {
        console.log("--- First Run ---");
        const data1 = await getActivities();
        console.log(data1);

        console.log("\n--- Second Run ---");
        const data2 = await getActivities();
        console.log(data2);

        console.log("\n--- Updating Activity ---");
        await updateActivity(1, 'Extreme Mountain Hiking');

        console.log("\n--- Third Run (After Update) ---");
        const data3 = await getActivities();
        console.log(data3);

    } catch (err) {
        console.error("Error running experiment:", err);
    } finally {
        // Disconnect to allow the script to exit
        if (client.isOpen) {
            await client.quit();
        }
    }
}

// Only run the experiment if this script is executed directly
if (require.main === module) {
    runExperiment();
}

module.exports = { getActivities, updateActivity, client };
