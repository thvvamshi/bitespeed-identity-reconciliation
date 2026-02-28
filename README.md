
# Bitespeed Backend Task – Identity Reconciliation

## Overview

This project implements the **Identity Reconciliation Service** as described in the official Bitespeed Backend Task.

The service consolidates customer identities across multiple purchases based on shared **email** and/or **phoneNumber**.

It ensures:

* Contact linking based on email or phone number
* Primary–secondary relationship maintenance
* Automatic merging of connected identities
* Deterministic primary selection (oldest contact remains primary)
* Consolidated response format as per specification

## Problem Summary

Bitespeed stores customer contact information in a relational table named `Contact`.

A single customer may have multiple rows in the database.

### Rules

* Contacts are linked if they share the same **email OR phoneNumber**
* The **oldest contact** in a group is marked as `"primary"`
* All others are marked as `"secondary"`
* If two primary contacts become connected, the older remains primary
* New incoming information creates a secondary contact
* Exact matches must NOT create duplicate rows

The service exposes a `POST /identify` endpoint that returns consolidated identity information.

## Database Schema

```sql
CREATE TABLE Contact (
   id INT AUTO_INCREMENT PRIMARY KEY,
   phoneNumber VARCHAR(20),
   email VARCHAR(255),
   linkedId INT,
   linkPrecedence ENUM('primary', 'secondary') NOT NULL,
   createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   deletedAt TIMESTAMP NULL
);
```

The table is automatically initialized on server startup.

## API Specification

### Endpoint: POST /identify

**Request Body (JSON)**

```json
{
   "email": "string (optional)",
   "phoneNumber": "string (optional)"
}
```

> At least one of `email` or `phoneNumber` must be provided.

**Response Format**

```json
{
   "contact": {
      "primaryContatctId": number,
      "emails": string[],
      "phoneNumbers": string[],
      "secondaryContactIds": number[]
   }
}
```

**Response Rules**

* First element of `emails[]` is the primary contact email
* First element of `phoneNumbers[]` is the primary contact phone
* `secondaryContactIds[]` contains all secondary contact IDs linked to primary

## Example

**Request**

```json
{
   "email": "mcfly@hillvalley.edu",
   "phoneNumber": "123456"
}
```

**Response**

```json
{
   "contact": {
      "primaryContatctId": 1,
      "emails": [
         "lorraine@hillvalley.edu",
         "mcfly@hillvalley.edu"
      ],
      "phoneNumbers": [
         "123456"
      ],
      "secondaryContactIds": [23]
   }
}
```

## Supported Features

* New primary creation
* Secondary creation on partial match
* Exact match detection (no duplicate insertion)
* Primary-to-secondary conversion
* Merging of two primary clusters
* Deterministic oldest-primary resolution
* Email-only and phone-only requests
* Null-safe handling
* Transaction-safe database operations

## Tech Stack

* Node.js
* Express.js
* MySQL
* MVC Architecture
* Database Transactions

## Project Structure

```
├── controllers/
│   └── identityController.js
├── models/
│   └── contactRepository.js
├── routes/
│   └── identityRoutes.js
├── db.js
├── app.js
├── server.js
├── package.json
└── README.md
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file:

```
DB_HOST=your_host
DB_USER=your_user
DB_PASS=your_password
DB_NAME=railway
DB_PORT=your_port
PORT=3000
```

### 3. Start Server

```bash
npm start
```

The server runs at `http://localhost:3000`.

## Deployment

**Base URL**

```
https://bitespeed-identity-reconciliation-sy46.onrender.com
```

**API Endpoint**

```
POST https://bitespeed-identity-reconciliation-sy46.onrender.com/identify
```

**Note:** Only the `/identify` endpoint accepts POST requests.

## Testing

Use the following configuration:

* Content-Type: `application/json`
* Method: `POST`
* Endpoint: `/identify`

**Example Request**

```bash
POST https://bitespeed-identity-reconciliation-sy46.onrender.com/identify
Content-Type: application/json

{
   "email": "alpha@gmail.com",
   "phoneNumber": "111"
}

```

