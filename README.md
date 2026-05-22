# Hospital Backend API

A Node.js/Express backend API for a hospital management system. This API handles doctors, appointments, and user authentication. It uses MySQL for database storage and includes file upload capabilities.

## Features
- **User Authentication**: Secure JWT-based authentication.
- **Doctors Management**: Endpoints to manage doctor profiles.
- **Appointments**: Schedule and manage patient appointments.
- **File Uploads**: Supports uploading files (e.g., doctor images).
- **Error Handling**: Centralized error handling middleware.

## Tech Stack
- **Node.js** & **Express.js** for the server environment.
- **MySQL2** for database connection and queries.
- **JWT (jsonwebtoken)** for authorization.
- **Bcryptjs** for password hashing.
- **Multer** for handling file uploads.
- **Jest & Supertest** for unit and integration testing.

## Prerequisites
- Node.js
- MySQL Server

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Check the `.env` file in the root directory to configure database and authentication variables (e.g., `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`).

3. **Database Setup:**
   Ensure your MySQL server is running and the database schema is created as per your configuration.

## Running the Application

- **Development Mode:** (uses nodemon to restart on changes)
  ```bash
  npm run dev
  ```
- **Production Mode:**
  ```bash
  npm start
  ```

## Testing

Run tests using Jest:
```bash
npm test
```
- Watch mode: `npm run test:watch`
- Coverage report: `npm run test:coverage`

## API Endpoints (Overview)
- **Auth**: `/api/auth` - Register and authenticate users.
- **Doctors**: `/api/doctors` - Manage doctor records.
- **Appointments**: `/api/appointments` - Book and manage appointments.
- **Health Check**: `/` and `/test-db` - Verify server and database connectivity.
- **Static Uploads**: `/uploads` - Access uploaded files.
