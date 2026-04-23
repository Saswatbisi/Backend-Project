/**
 * 🤖 test-bot.js — MeetMux Bot Simulator
 * Simulates a brute-force attack by firing 10 rapid POST requests
 * to /api/login. After 5 attempts the server should respond 429.
 */

const http = require('http');

const payload = JSON.stringify({ email: 'bot@attack.com', password: 'wrongpassword' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  },
};

async function sendRequest(attempt) {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const icon = res.statusCode === 429 ? '🚨' : res.statusCode < 400 ? '✅' : '❌';
        console.log(
          `${icon}  Attempt #${attempt} → HTTP ${res.statusCode} | Response: ${body.trim()}`
        );
        resolve(res.statusCode);
      });
    });

    req.on('error', (err) => {
      console.error(`  Attempt #${attempt} → ERROR: ${err.message}`);
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}

(async () => {
  console.log('🤖 Bot starting — firing 10 rapid requests at POST /api/login...\n');
  for (let i = 1; i <= 10; i++) {
    const status = await sendRequest(i);
    if (status === 429) {
      console.log('\n🛡️  Rate limiter kicked in! Server is protected.');
    }
  }
  console.log('\n✅ Bot test complete.');
})();
