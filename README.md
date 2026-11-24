# EquipRent Server

The backend API for **EquipRent**, an equipment rental platform. It provides authentication, role-based access control, equipment management, bookings, favorites, owner applications, and Stripe payment processing.

## Live API

**Production Server:** https://equiprent-server.vercel.app/

**API Base URL:** https://equiprent-server.vercel.app/api

## Tech Stack

- Node.js
- Express.js 5
- TypeScript
- MongoDB
- Mongoose
- JWT Authentication
- Zod Validation
- Stripe Checkout & Webhooks
- Nodemailer
- ImgBB
- Helmet, CORS, and Express Rate Limit

## Features

- User authentication and authorization
- Role-based access for Customers, Owners, and Admins
- Equipment management
- Equipment search and filtering
- Booking and availability management
- Favorites management
- Owner application management
- Stripe Checkout integration
- Stripe webhook payment verification
- Owner earnings and payment records
- Request validation and centralized error handling
- Secure HTTP headers and CORS configuration

## Project Structure

```text
equiprent-server/
├── src/
│   ├── config/
│   ├── middlewares/
│   ├── modules/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── bookings/
│   │   ├── equipment/
│   │   ├── favorites/
│   │   ├── health/
│   │   ├── owner-applications/
│   │   ├── payments/
│   │   └── users/
│   ├── routes/
│   ├── app.ts
│   └── server.ts
├── .env.example
├── package.json
└── tsconfig.json
```

## Prerequisites

- Node.js
- npm
- MongoDB (local instance or MongoDB Atlas)
- Stripe account for payment testing
- Stripe CLI for local webhook testing

## Installation

Clone the repository and navigate to the server directory:

```bash
cd equiprent-server
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```powershell
Copy-Item .env.example .env
```

Configure the environment variables in `.env`.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NODE_ENV` | Application environment | No |
| `PORT` | API server port | No |
| `DATABASE_URL` | MongoDB connection string | Yes |
| `CLIENT_URL` | Frontend origin for CORS | No |
| `JWT_ACCESS_SECRET` | Access token signing secret | Yes |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiration | No |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | Yes |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | No |
| `COOKIE_SECURE` | Secure cookie setting | No |
| `JWT_ACCESS_COOKIE_MAX_AGE_MS` | Access cookie lifetime | No |
| `JWT_REFRESH_COOKIE_MAX_AGE_MS` | Refresh cookie lifetime | No |
| `SMTP_HOST` | SMTP server hostname | No |
| `SMTP_PORT` | SMTP server port | No |
| `SMTP_SECURE` | SMTP TLS setting | No |
| `SMTP_USER` | SMTP username | No |
| `SMTP_PASSWORD` | SMTP password or app password | No |
| `EMAIL_FROM` | Sender email address | No |
| `IMGBB_API_KEY` | ImgBB image hosting API key | No |
| `STRIPE_SECRET_KEY` | Stripe secret API key | For payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | For webhooks |
| `STRIPE_CURRENCY` | Checkout currency (default: `usd`) | No |

**Important:** Never commit `.env` or expose secret keys. Use `.env.example` only as a template.

## Running the Server

Start the development server:

```bash
npm run dev
```

The local API runs at:

```text
http://localhost:5000
```

Root endpoint:

```text
GET http://localhost:5000/
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with watch mode |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled production server |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Run ESLint |

## Stripe Webhook Testing

EquipRent uses Stripe Checkout and webhooks to verify successful payments and process booking creation.

1. Configure `STRIPE_SECRET_KEY` in the server `.env` file using your Stripe test-mode secret key.
2. Start the backend:

   ```bash
   npm run dev
   ```

3. Install and authenticate Stripe CLI.
4. Start the webhook listener in another terminal:

   ```bash
   stripe listen --events v1.checkout.session.completed --forward-to http://127.0.0.1:5000/api/payments/webhook
   ```

5. Copy the webhook signing secret printed by Stripe CLI into `STRIPE_WEBHOOK_SECRET`.
6. Restart the backend after changing environment variables.
7. Complete a test checkout through the EquipRent frontend.

Keep the backend and Stripe CLI listener running during local webhook testing.

**Note:** Use Stripe test-mode credentials for development. Actual payment availability and supported currencies depend on the Stripe account configuration.

## API Base URL

Local:

```text
http://localhost:5000/api
```

Production:

```text
https://equiprent-server.vercel.app/api
```

The API uses JSON responses and cookie-based authentication where applicable.

## Security Notes

- Keep credentials in environment variables.
- Never expose Stripe secret keys.
- Never commit `.env` files.
- Use HTTPS and secure cookies in production.
- Configure CORS with the deployed frontend origin.
- Configure Stripe webhook secrets separately for each environment.

## License

This project was developed as an equipment rental platform assignment.