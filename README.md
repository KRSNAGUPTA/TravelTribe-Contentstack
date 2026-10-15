# Travel Tribe

A hostel booking platform for students — find, compare, and reserve verified
hostels near Mumbai colleges.

- **Live:** https://travel-tribe-cs.vercel.app
- **API:** https://traveltribe-contentstack.onrender.com
- **API reference:** [`server/openapi.yaml`](server/openapi.yaml) (OpenAPI 3.1)

Monorepo (npm workspaces): `client/` (React + Vite) and `server/` (Express + MongoDB).

---

## Features

- **CMS-driven content** — hero, features, testimonials, FAQs, footer and hostel listings authored in Contentstack, with Live Preview
- **Search & filter** — Algolia autocomplete on the client; college / location / price filters on the API
- **Real-time availability** — per-night, per-room-type bed calendar computed from active bookings
- **Secure payments** — Razorpay order creation, HMAC signature verification, one payment funds exactly one booking
- **Transactional bookings** — MongoDB transactions prevent overbooking
- **Reviews** — only users with a confirmed booking can review; one review per user per hostel
- **Auth** — JWT access token (15 min) + rotating HttpOnly refresh cookie (30 days) with reuse detection, Google OAuth, OTP password reset
- **Notifications** — booking confirmation emails (Gmail SMTP) and Discord webhook alerts
- **Receipts** — downloadable PDF generated client-side

## Architecture

```
React (Vercel) ──► Contentstack Delivery API   (hostel/page content)
      │
      └────────► Express API (Render) ──► MongoDB   users, bookings, payments, inventory, reviews
                       │
                       ├──► Contentstack (hostel list proxy + lazy inventory seeding)
                       ├──► Razorpay      (orders + signature verification)
                       ├──► Gmail SMTP    (OTP + booking emails)
                       └──► Discord webhook (login/booking/support/subscribe alerts)
```

Hostel documents in MongoDB are created lazily: the first availability check or
booking for a CMS hostel seeds `room_types` and bed totals from the CMS entry
(`total_beds`, default 10).

### Payment → booking flow

1. `POST /api/payment/create-order` – Razorpay order + `Payment` record (`created`)
2. Razorpay Checkout opens in the browser
3. `POST /api/payment/verify-payment` – signature verified, returns internal `paymentId`
4. `POST /api/booking` with that `paymentId` – accepted only if the payment is
   verified, unused, owned by the caller, for the same hostel, and the amount matches

## Tech stack

| Layer | Choice |
|---|---|
| Client | React 18, Vite, Tailwind CSS, shadcn/ui |
| CMS / Search | Contentstack (EU), Algolia |
| API | Node 20+ (22 recommended), Express 4, Mongoose 9 |
| Database | MongoDB (replica set required for transactions) |
| Payments | Razorpay |
| Auth | JWT + refresh cookie, Google OAuth |
| Security | helmet, CORS allow-list, express-rate-limit |
| Deploy | Vercel (client) + Render (API) |

---

## Getting started

### Prerequisites

- Node.js 20.19+ (the Docker image uses Node 22)
- MongoDB **running as a replica set** (or Atlas). Bookings use transactions,
  which fail on a standalone `mongod`.
- Accounts/keys for Contentstack, Razorpay (test mode is fine), Google OAuth,
  Algolia; a Gmail app password and Discord webhook are optional

### 1. Install

```bash
npm install            # installs both workspaces from the repo root
```

### 2. Configure

```bash
cp server/sampleEnv server/.env
cp client/sampleEnv client/.env
```

Fill in the values (see tables below). **Never commit `.env` files.**

### 3. Run

```bash
npm run dev            # client (http://localhost:5173) + server (http://localhost:5001)
# or individually
npm run client
npm run server
```

### Docker (API + Mongo replica set)

```bash
docker compose up --build
```

Starts the API on `:5001`, MongoDB 7 as a single-node replica set `rs0` on
`:27017`, and mongo-express on `:8081`. `MONGO_URI` is overridden inside
compose to `mongodb://mongo:27017/traveltribe?replicaSet=rs0`. The client is
not containerised — run `npm run client` on the host.

> mongo-express uses `admin/admin` basic auth. Local development only.

---

## Environment variables

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | no | `production` switches to `MONGO_URI_PROD` and stricter rate limit (100 req/15 min vs 500) |
| `PORT` | no | Default `5001` |
| `MONGO_URI` | dev | e.g. `mongodb://localhost:27017/traveltribe?replicaSet=rs0` |
| `MONGO_URI_PROD` | prod | Atlas SRV URI |
| `JWT_SECRET` | yes | Long random string (64+ hex chars) |
| `CORS_ORIGIN` | yes | Client origin, e.g. `http://localhost:5173` (localhost:5173/3000 always allowed) |
| `GOOGLE_CLIENT_ID` | yes | Same ID as the client |
| `CS_API_KEY`, `CS_ACCESS_TOKEN` | yes | Contentstack stack API key + delivery token |
| `CS_BASE_URL` | no | Default `https://eu-cdn.contentstack.com/v3` |
| `CS_BRANCH` | no | Default `main` |
| `CS_DEV_ENV` | no | Contentstack environment, default `dev` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | yes | Razorpay keys |
| `EMAIL_USER`, `APP_PASSWORD` | yes* | Gmail address + app password (OTP and booking emails) |
| `DISCORD_BOT_WEBHOOK` | no | Webhook for notifications; support/subscribe endpoints return a config message without it |

\* Password reset and confirmation emails fail without these.

### Client (`client/.env`)

Every variable must start with `VITE_`. Restart the dev server after edits.

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (e.g. `http://localhost:5001`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_RAZORPAY_KEY_ID` | Razorpay **key id** (public) |
| `VITE_CS_API_KEY`, `VITE_CS_ACCESS_TOKEN`, `VITE_CS_PREVIEW_TOKEN` | Contentstack keys |
| `VITE_CS_BRANCH`, `VITE_CS_LOCALE`, `VITE_CS_DEV_ENV` | Defaults: `main`, `en-us`, `dev` |
| `VITE_CS_REGION` | Must match the stack region (`us`, `eu`, `au`, `azure-na`, `azure-eu`, `gcp-na`, `gcp-eu`) — a mismatch returns `412` |
| `VITE_CS_ENABLE_LIVE_PREVIEW` | `true` in dev, `false` in production |
| `VITE_CS_DEV_APP_HOST` | Optional, e.g. `eu-app.contentstack.com` |
| `VITE_ALGOLIA_APP_ID`, `VITE_ALGOLIA_SEARCH_KEY`, `VITE_ALGOLIA_INDEX_NAME` | Algolia (search-only key) |

---

## API overview

Full contract: [`server/openapi.yaml`](server/openapi.yaml). Protected routes need
`Authorization: Bearer <accessToken>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/user/signup`, `/login`, `/google/callback`, `/refresh`, `/logout`, `/forgot-password`, `/verify-otp`, `/reset-password` |
| Users | `GET /api/user/profile`, `PATCH /api/user/update`, `GET /api/user/:id`; admin: `GET /all`, `/search`, `PATCH /make-admin/:id`, `/remove-admin/:id`, `DELETE /:id` |
| Hostels | `GET /api/hostel` (filters: `q`, `college`, `location`, `price`, `page`, `limit`), `GET /availability`, `GET /:id`, admin `DELETE /:id` |
| Reviews | `GET/POST /api/hostel/:id/reviews`, `DELETE /api/hostel/:id/reviews/:reviewId` |
| Payments | `POST /api/payment/create-order`, `/verify-payment` |
| Bookings | `POST /api/booking`, `GET /my-bookings`, `GET /:id`, `PUT /:id/cancel`, `GET /:id/receipt`; admin `GET /`, `PUT /:id/confirm` |
| Misc | `POST /api/support`, `POST /api/subscribe`, `GET /api` |

Rate limits: 100 req/15 min per IP on `/api` in production; 10 req/15 min on
login, signup, forgot-password, verify-otp and reset-password.

View the spec interactively:

```bash
npx @redocly/cli preview-docs server/openapi.yaml
```

## Project structure

```
.
├── client/                    React + Vite app
│   └── src/
│       ├── api.js             axios instance + silent token refresh
│       ├── contentstack/      SDK init + entry helpers
│       ├── context/           AuthContext
│       ├── components/        Header, Footer, HostelCard, RazorPayPayment, ui/
│       ├── pages/             Home, Hostels, HostelDetails, BookHostel, Profile, Login, ...
│       └── services/          Algolia search
├── server/
│   ├── openapi.yaml
│   └── src/
│       ├── index.js           app setup, CORS, rate limits, routes
│       ├── config/            db, razorpay
│       ├── controllers/       user, hostel, review, booking, payment
│       ├── model/             User, Hostel, Booking, Payment
│       ├── middlewares/       protect, adminOnly
│       ├── routes/
│       ├── services/          emailService (Gmail SMTP)
│       ├── discordBot/        webhook notifications
│       └── contentstackClient.js
├── Dockerfile
└── docker-compose.yml
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Client + server together |
| `npm run client` / `npm run server` | One workspace |
| `npm run build --workspace=client` | Production client build |
| `npm run lint --workspace=client` | ESLint |
| `npm start --workspace=server` | Run the API without nodemon |

## Deployment

- **Client (Vercel):** root `client/`, build `npm run build`, output `dist`. Set all `VITE_*` vars. `vercel.json` handles SPA rewrites.
- **API (Render):** build `npm install`, start `npm start --workspace=server`. Set `NODE_ENV=production`, `MONGO_URI_PROD`, and the rest of the server vars. Set `CORS_ORIGIN` to the Vercel URL.

## Notes & known limits

- Render's free tier cold-starts in 20–60 s; the sticky banner warns users.
- `GET /api/hostel` fetches entries from the Contentstack Delivery API and
  filters/paginates in memory. Contentstack returns at most 100 entries per
  request by default, so add API-side pagination if the catalog outgrows that.
- Cancelling a booking does not trigger a Razorpay refund; refunds are manual.
- Ad blockers can break Live Preview; allow-list your dev origin.
- No automated tests yet (`npm test` is a placeholder).