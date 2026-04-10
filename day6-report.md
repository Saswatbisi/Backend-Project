# 📊 Day 6 Report – Authentication & Security (Node.js Backend)

## 🔹 Technical Summary
Today, I implemented **Authentication and Security** in a Node.js backend application.  

The main concepts covered were:
- **Password Hashing using Bcrypt** to securely store user passwords
- **JSON Web Tokens (JWT)** for authentication and session management
- **Middleware Protection** to restrict access to private routes

I created a secure system where:
- User passwords are hashed before saving to the database
- Users receive a token after login
- Only authenticated users can access protected routes like `/dashboard`

---

## 🔹 Implementation Details

### 1. Password Hashing
- Used `bcryptjs` to hash passwords
- Implemented a **pre-save hook** in the User model
- Ensures passwords are never stored in plain text

### 2. Login & Token Generation
- Created `/login` route
- Verified user credentials using bcrypt
- Generated JWT token using `jsonwebtoken`
- Token includes user ID and expires in 1 hour

### 3. Authentication Middleware
- Created `auth.js` middleware
- Checks for token in request headers (`x-auth-token`)
- Verifies token and allows access if valid
- Blocks unauthorized users

### 4. Protected Route
- Created `/dashboard` route
- Only accessible with valid JWT
- Returns a success message when authenticated

---

## 🔹 Testing & Results

### ✅ Step 1: Register
- Successfully created a user
- Verified in MongoDB that password is hashed

### ✅ Step 2: Login
- Successfully received JWT token

### ✅ Step 3: Access Control

- ❌ Without token → Access denied (401 Unauthorized)
- ✅ With token → Access granted to dashboard

### 🔁 Flow Tested:
Register → Login → Get Token → Access Protected Route

---

## 🔹 Challenges Faced

- Understanding difference between hashing and encryption
- Handling token verification errors
- Setting up middleware correctly for route protection

---

## 🔹 Key Learnings

- Hashing is irreversible and ensures password security
- JWT enables stateless authentication
- Middleware is essential for securing APIs
- Security is a critical part of backend development

---

## 🔹 Experiment (Reflection Question)

**Why is it dangerous to store a JWT Secret Key directly in the code instead of an environment variable (.env)?**

Storing the JWT secret key directly in the code is dangerous because if the code is exposed (for example, pushed to a public GitHub repository), attackers can access the secret key. This would allow them to generate valid tokens and impersonate users, leading to unauthorized access. Using environment variables keeps sensitive data secure and prevents exposure.

---

## 🔹 Conclusion

Day 6 focused on implementing real-world backend security practices. By adding authentication, hashing, and protected routes, the application is now more secure and closer to production-level standards.

---
