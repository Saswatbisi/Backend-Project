async function runTest() {
  console.log("🔍 Fetching posts to get a Post ID...");
  const fetch = (await import('node-fetch')).default; // Fallback or native fetch available in Node 18+
  
  let res = await fetch("http://localhost:5000/api/posts");
  let data = await res.json();
  
  if (!data.posts || data.posts.length === 0) {
    console.log("No posts found to test with!");
    return;
  }
  
  const postId = data.posts[0]._id;
  console.log(`✅ Using Post ID: ${postId}\n`);

  // Test 1: The Miss
  console.log("--- TEST 1: THE MISS (First Request) ---");
  let start = Date.now();
  await fetch(`http://localhost:5000/api/posts/${postId}`);
  let time1 = Date.now() - start;
  console.log(`⏱️ Time taken: ${time1}ms\n`);

  // Test 2: The Hit
  console.log("--- TEST 2: THE HIT (Second Request) ---");
  start = Date.now();
  await fetch(`http://localhost:5000/api/posts/${postId}`);
  let time2 = Date.now() - start;
  console.log(`⏱️ Time taken: ${time2}ms\n`);

  // Test 3: Cache Invalidation
  console.log("--- TEST 3: CACHE INVALIDATION (Updating Post) ---");
  await fetch(`http://localhost:5000/api/posts/${postId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: "Updated by Experiement!" })
  });
  console.log("✅ Post updated via PUT request.\n");

  // Test 4: Verification 
  console.log("--- TEST 4: VERIFYING INVALIDATION (Third Request) ---");
  start = Date.now();
  await fetch(`http://localhost:5000/api/posts/${postId}`);
  let time3 = Date.now() - start;
  console.log(`⏱️ Time taken: ${time3}ms (Should be slower, like a Miss)\n`);
  
  console.log("✅ Experiment Complete!");
}

runTest();
