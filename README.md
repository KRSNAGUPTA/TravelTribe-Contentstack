# TravelTribe

TravelTribe is a full-stack hostel discovery and booking app.

- Frontend: React + Vite (client)
- Backend: Node.js + Express + MongoDB (server)
- CMS: Contentstack
- Payments: Razorpay
- Auth: Email/password + Google login
- Personalization/analytics: Lytics

## Monorepo Structure

- `client/`: React app (UI, pages, tracking, CMS rendering)
- `server/`: Express API (auth, bookings, payments, webhooks)
- `docker-compose.yml`: local dev stack (server + MongoDB + mongo-express)

## Prerequisites

- Node.js 18+
- npm 9+
- Docker (optional, for containerized setup)
- MongoDB (only if running server without Docker)

## Environment Setup

Create these files before running:

1. `client/.env` from `client/sampleEnv`
2. `server/.env` from `server/sampleEnv`

Populate all required values (Google, Contentstack, Razorpay, JWT, Mongo, etc.).

## Install Dependencies

Run from project root:

```bash
npm install
```

This installs dependencies for both workspaces (`client` and `server`).

## Run Locally (Without Docker)

From project root:

```bash
# Run both client and server together
npm run dev

# Or run separately
npm run client
npm run server
```

Default local URLs:

- Client: `http://localhost:5173`
- Server API: `http://localhost:5001`

## Run With Docker

Make sure `server/.env` is configured, then run:

```bash
docker compose up --build
```

Services:

- Server: `http://localhost:5001`
- MongoDB: `mongodb://localhost:27017`
- Mongo Express: `http://localhost:8081` (admin/admin)

## Build

Client production build:

```bash
npm run build --workspace=client
```

Server production start:

```bash
npm run start --workspace=server
```

## Core Feature Flow

1. Content/pages are fetched from Contentstack.
2. User signs up or logs in (email/password or Google OAuth).
3. User selects hostel and room, starts payment (Razorpay).
4. Backend verifies payment, creates booking, triggers notifications.
5. Profile and personalized data can be read from Lytics.

## Important Integrations

- Contentstack: content + automation endpoints
- Razorpay: order creation and payment verification
- Google OAuth: social login
- Cloudinary: media storage support on server
- Lytics: tracking + profile enrichment
- Discord webhook: optional admin notifications

## Troubleshooting

- If CMS content is missing:
	check Contentstack keys and environment values in both `.env` files.
- If login fails:
	verify `JWT_SECRET`, `GOOGLE_CLIENT_ID`, and client Google ID.
- If booking/payment fails:
	confirm Razorpay keys are set on both client and server.
- If server cannot connect DB:
	validate `MONGO_URI`/`MONGO_URI_PROD`.
- If subscription/support emails fail:
	verify `EMAIL_AUTOMATE_KEY`.

## Notes

- Keep secrets only in `.env` files (never commit real credentials).
- Sample env files are templates and should not contain production values.
