# share_ride_backend

Node.js + Express backend for Share Ride app login.

## Setup

1. Install dependencies:
   - `npm install`
2. Copy env file:
   - `cp .env.example .env`
3. Start development server:
   - `npm run dev`

Server runs on `http://localhost:4000` by default.

## GCP Cloud SQL (PostgreSQL)

Use Cloud SQL as your app database (GCP equivalent to managed RDS).

Set these values in `.env`:
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_PORT`
- `DB_SSL=true` (if your setup requires SSL)
- `CLOUD_SQL_CONNECTION_NAME` (for Cloud SQL Auth Proxy / Cloud Run)

If you are connecting directly by IP, use:
- `DB_HOST=<cloud-sql-private-or-public-ip>`

### Required users table

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);
```

To store passwords from signup, hash with `bcrypt` and save in `password_hash`.

## API

### Health check

- `GET /api/health`
- `GET /api/health/db`

### Login

- `POST /api/auth/login`
- Request body:

```json
{
  "email": "demo@shareride.com",
  "password": "password123"
}
```

Returns JWT token and user details on success.