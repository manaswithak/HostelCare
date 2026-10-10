# Hostel Complaint Management (MERN)

A starter MERN app for students, rectors, and hostel-department administrators.

## Features
- Separate login for `student`, `rector`, and `admin` roles
- Students submit complaints and see status plus the resolution/update posted by staff
- Rectors view complaints, change status, and add a resolution note
- Admins see all complaints and can manage complaint status/resolution
- JWT authentication and password hashing
- MongoDB data persistence

> This is a working starter project, not a production-ready university deployment. Add HTTPS, email/password reset, audit logs, rate limiting, backups, and institution-approved access controls before real use.

## Requirements
- Node.js 18+
- MongoDB Community running locally, or a MongoDB Atlas connection string

## Setup

### 1. Backend
```bash
cd server
copy .env.example .env
```
On macOS/Linux, use `cp .env.example .env` instead of `copy`.

Edit `server/.env` and set a long random `JWT_SECRET` and your MongoDB URI.

Install and start:
```bash
npm install
npm run dev
```
Backend runs at `http://localhost:5000`.

### 2. Create the first admin
With the backend running, open a second terminal in `server`:
```bash
npm run create-admin
```
It creates an admin from `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env`. Change the password after initial setup; never commit `.env`.

### 3. Frontend
Open a second terminal:
```bash
cd client
copy .env.example .env
npm install
npm run dev
```
Open the URL Vite prints (usually `http://localhost:5173`).

## Creating rector accounts
Log in as admin and use the **Create rector account** form. Students can self-register from the login page. Public registration only permits the student role; clients cannot choose admin or rector.

## Roles
- **Student:** create complaint, see own complaints and their status/resolution.
- **Rector:** see all complaints, update status, post resolution note.
- **Admin / Hostel Department:** see all complaints, update status, post resolution note, create rector accounts.

## Troubleshooting
- `MongoServerSelectionError`: start MongoDB or verify `MONGO_URI`.
- `Invalid token`: log in again.
- CORS issues: set `CLIENT_URL` to the frontend URL.
