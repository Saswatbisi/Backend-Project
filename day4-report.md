# Day 4 Report

## 🔧 Technical Summary
Today I worked on improving backend structure and security. I implemented environment variables using `.env` to securely store sensitive data like API keys and port numbers. I also applied the Controller Pattern to separate route handling logic from the main server file, making the code more modular and maintainable. Additionally, I implemented POST request handling with proper validation using Express middleware.

---

## 🐞 The "Bug" Log
Issue: Initially, the POST `/api/register` route was not working when tested in the browser.

Cause: Browsers only support GET requests, while this route requires a POST request.

Fix: I used Thunder Client to send a POST request with JSON data. After configuring the request properly and ensuring `express.json()` middleware was enabled, the API worked successfully.

---

## 💡 Conceptual Reflection

### ❓ Why do we use `.env` files instead of writing keys directly in code?

We use `.env` files to store sensitive information like API keys, database URLs, and ports securely. This prevents exposing confidential data on GitHub and improves security. It also allows flexibility in changing configurations without modifying the source code.

---

## 📊 HTTP Status Codes Used
- 200 → OK (All GET APIs working successfully)
- 201 → Created (POST request working successfully)
- 400 → Bad Request (Validation for missing fields)

---

## ✅ Final Outcome
All API endpoints (`/`, `/about`, `/status`, `/api/users`, `/api/register`) are working correctly. The backend is now structured, secure, and follows industry-level practices.
