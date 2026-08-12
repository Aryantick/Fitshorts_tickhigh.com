# Backend API Documentation

This document provides a comprehensive guide to the Backend REST API endpoints, multi-tenant configuration, request headers, request bodies, and sample JSON responses.

---

## 🌐 Overview & Base Configuration

* **Base URL:** `http://localhost:5000/api`
* **Content-Type:** `application/json`

---

## 🏢 Multi-Tenant Header Configuration

The backend supports multiple telecom tenants (e.g., **Zain South Sudan** and **Orange Burkina Faso**).

To target a specific tenant when testing locally or from a frontend application, include the `x-client-subdomain` header in every request.

| Tenant | Subdomain (`x-client-subdomain`) | Operator | Base Telecom API URL |
|---|---|---|---|
| **Wellness360 Default** | `backreel` | Zain (SS) | `https://wbilzss.tickhighs.com` |
| **Orange Burkina Faso** | `obf` | Orange (BF) | `https://obfpartner.telecomnetsolution.com` |

---

## 📑 Table of Contents

1. [MSISDN & Subscription Status](#1-msisdn--subscription-status)
   - [Check MSISDN Status](#11-check-msisdn-status)
   - [Select Plan](#12-select-plan)
2. [Subscription OTP Flow (New / Unsubscribed Users)](#2-subscription-otp-flow-new--unsubscribed-users)
   - [Send Subscription OTP](#21-send-subscription-otp)
   - [Verify Subscription OTP](#22-verify-subscription-otp)
3. [Auth OTP Flow (Existing Subscribed Users)](#3-auth-otp-flow-existing-subscribed-users)
   - [Send Auth OTP](#31-send-auth-otp)
   - [Verify Auth OTP](#32-verify-auth-otp)
   - [Unsubscribe User](#33-unsubscribe-user)
4. [Session & User Management](#4-session--user-management)
   - [Refresh Access Token](#41-refresh-access-token)
   - [Logout User](#42-logout-user)
   - [Get Current User Profile](#43-get-current-user-profile)

---

## 1. MSISDN & Subscription Status

### 1.1 Check MSISDN Status

Checks whether a user's phone number is subscribed, unsubscribed, or active, and returns the recommended next step.

* **HTTP Method:** `POST`
* **Endpoint:** `/api/msisdn/check`
* **Headers:**
  ```http
  Content-Type: application/json
  x-client-subdomain: obf
  ```

#### Request Body:
```json
{
  "msisdn": "22674031858"
}
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "status": 200,
  "timestamp": "2026-08-05T05:40:00.000Z",
  "message": "MSISDN status checked successfully",
  "data": {
    "currentStatus": "unSubscribed",
    "subscriptionStatus": "successful",
    "nextStep": "SHOW_PLAN_PAGE"
  }
}
```

#### Possible `nextStep` Values:
- `"SHOW_PLAN_PAGE"`: User is new or unsubscribed. Direct them to choose a subscription plan.
- `"AUTH_OTP_LOGIN"`: User is active. Direct them to login via `/api/auth-otp/send`.
- `"LOW_BLANCE"`: User has insufficient balance.

---

### 1.2 Select Plan

Validates the subscription plan chosen by the user.

* **HTTP Method:** `POST`
* **Endpoint:** `/api/plan/select`
* **Headers:**
  ```http
  Content-Type: application/json
  x-client-subdomain: obf
  ```

#### Request Body:
```json
{
  "msisdn": "22674031858",
  "subServiceId": "FDaily"
}
```

> **Valid `subServiceId` values:** `"FDaily"`, `"FWeekly"`, `"FMonthly"`

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "status": 200,
  "timestamp": "2026-08-05T05:40:00.000Z",
  "message": "Plan validated successfully",
  "data": {
    "msisdn": "22674031858",
    "subServiceId": "FDaily",
    "message": "Plan selected successfully"
  }
}
```

---

## 2. Subscription OTP Flow (New / Unsubscribed Users)

Use this flow when a user is **not subscribed** and needs to select a plan and register.

### 2.1 Send Subscription OTP

Triggers a subscription PIN/OTP to the user's mobile number.

* **HTTP Method:** `POST`
* **Endpoint:** `/api/otp/send`
* **Headers:**
  ```http
  Content-Type: application/json
  x-client-subdomain: obf
  ```

#### Request Body:
```json
{
  "msisdn": "22674031858",
  "subServiceId": "Health Portal Livliness pass jour"
}
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "status": 200,
  "timestamp": "2026-08-05T05:40:00.000Z",
  "message": "OTP sent successfully",
  "data": {
    "msisdn": "22674031858",
    "transactionId": "TXN_987654321"
  }
}
```

---

### 2.2 Verify Subscription OTP

Verifies the subscription OTP. If verification succeeds and the user is new, it **creates a new user record** in the database and returns JWT authentication tokens.

* **HTTP Method:** `POST`
* **Endpoint:** `/api/otp/verify`
* **Headers:**
  ```http
  Content-Type: application/json
  x-client-subdomain: obf
  ```

#### Request Body:
```json
{
  "msisdn": "22674031858",
  "otp": "123456"
}
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "status": 200,
  "timestamp": "2026-08-05T05:40:00.000Z",
  "message": "OTP verified successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "msisdn": "22674031858"
    }
  }
}
```
*(Also sets `refreshToken` as an HTTP-only cookie).*

---

## 3. Auth OTP Flow (Existing Subscribed Users)

Use this flow when an **already active user** is logging back into the app.

### 3.1 Send Auth OTP

Sends a standard login OTP via SMS.

* **HTTP Method:** `POST`
* **Endpoint:** `/api/auth-otp/send`
* **Headers:**
  ```http
  Content-Type: application/json
  x-client-subdomain: obf
  ```

#### Request Body:
```json
{
  "msisdn": "22674031858"
}
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "status": 200,
  "timestamp": "2026-08-05T05:40:00.000Z",
  "message": "OTP sent successfully",
  "data": {
    "msisdn": "22674031858",
    "transactionId": "TXN_123456789"
  }
}
```

---

### 3.2 Verify Auth OTP

Verifies the login OTP for an existing user and returns JWT tokens.

* **HTTP Method:** `POST`
* **Endpoint:** `/api/auth-otp/verify`
* **Headers:**
  ```http
  Content-Type: application/json
  x-client-subdomain: obf
  ```

#### Request Body:
```json
{
  "msisdn": "22674031858",
  "otp": "123456"
}
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "status": 200,
  "timestamp": "2026-08-05T05:40:00.000Z",
  "message": "OTP verified successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "msisdn": "22674031858"
    }
  }
}
```

#### Error Response if User is Not Subscribed (`400 Bad Request`):
```json
{
  "success": false,
  "status": 400,
  "timestamp": "2026-08-05T05:40:00.000Z",
  "message": "User not found. Please subscribe first.",
  "data": null
}
```

---

### 3.3 Unsubscribe User

Unsubscribes the user from the telecom operator service.

* **HTTP Method:** `POST`
* **Endpoint:** `/api/unsubscribe`
* **Headers:**
  ```http
  Content-Type: application/json
  x-client-subdomain: obf
  ```

#### Request Body:
```json
{
  "msisdn": "22674031858"
}
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "status": 200,
  "timestamp": "2026-08-05T05:40:00.000Z",
  "message": "Unsubscribed successfully",
  "data": {
    "msisdn": "22674031858",
    "unsubscribed": true
  }
}
```

---

## 4. Session & User Management

### 4.1 Refresh Access Token

Issues a new JWT access token using the HTTP-only refresh token cookie.

* **HTTP Method:** `POST`
* **Endpoint:** `/api/auth/refresh`
* **Headers:**
  ```http
  Content-Type: application/json
  x-client-subdomain: obf
  ```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "status": 200,
  "timestamp": "2026-08-05T05:40:00.000Z",
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 4.2 Logout User

Revokes the user's active refresh token and clears session cookies.

* **HTTP Method:** `POST`
* **Endpoint:** `/api/auth/logout`
* **Headers:**
  ```http
  Authorization: Bearer <YOUR_ACCESS_TOKEN>
  x-client-subdomain: obf
  ```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "status": 200,
  "timestamp": "2026-08-05T05:40:00.000Z",
  "message": "Logged out successfully",
  "data": null
}
```

---

### 4.3 Get Current User Profile

Fetches details of the currently authenticated user.

* **HTTP Method:** `GET`
* **Endpoint:** `/api/me`
* **Headers:**
  ```http
  Authorization: Bearer <YOUR_ACCESS_TOKEN>
  x-client-subdomain: obf
  ```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "status": 200,
  "timestamp": "2026-08-05T05:40:00.000Z",
  "message": "User profile fetched successfully",
  "data": {
    "id": 1,
    "msisdn": "22674031858",
    "display_name": null,
    "avatar_key": null,
    "is_active": 1,
    "created_at": "2026-08-04T12:00:00.000Z"
  }
}
```

---

## 🛠️ Error Response Structure

All error responses follow the standard JSON envelope structure:

```json
{
  "success": false,
  "status": 400,
  "timestamp": "2026-08-05T05:40:00.000Z",
  "message": "Error description message here",
  "data": null
}
```

### Common HTTP Status Codes:
- `200 OK`: Request succeeded.
- `400 Bad Request`: Validation failure or missing parameters (e.g. invalid OTP, missing MSISDN).
- `401 Unauthorized`: Missing or invalid JWT access token.
- `404 Not Found`: Tenant/Client or resource not found.
- `500 Internal Server Error`: Server error or failed upstream telecom request.
