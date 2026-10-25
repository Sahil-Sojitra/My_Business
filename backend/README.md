# My Business Backend API

Backend API for **My Business** — a ledger and consignment management platform for diamond brokers. Built with Node.js, TypeScript, Express, Prisma ORM, and PostgreSQL.

---

## 1. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Brevo Transactional Email Variables

```env
# Brevo (formerly Sendinblue) Transactional Email Configuration
BREVO_API_KEY="xkeysib-your-api-key-here"
BREVO_SENDER_EMAIL="your-verified-sender@example.com"
BREVO_SENDER_NAME="My Business"
```

### How to set up Brevo:
1. **Create an Account & API Key**:
   - Register or sign in at [app.brevo.com](https://app.brevo.com).
   - Go to **Settings > SMTP & API > API Keys**.
   - Click **Generate a new API key**, name it (e.g. `My Business Backend`), and copy the key into `BREVO_API_KEY`.
2. **Verify Sender Email / Domain**:
   - In Brevo, go to **Settings > Senders & Domains**.
   - Click **Add a Sender** or **Add a Domain**.
   - Enter your email address (e.g. `support@yourdomain.com`).
   - Open the verification email sent by Brevo and confirm the address.
   - Enter this exact verified email as `BREVO_SENDER_EMAIL`.

---

## 2. Database Migrations

Apply database migrations:

```bash
# Apply migrations to database:
npx prisma migrate deploy

# Generate Prisma Client:
npm run prisma:generate
```

> **Migration Note:** Migration `20261025122243_add_email_otp_and_verification` creates the `email_otps` table and adds `isEmailVerified` & `tokenVersion` to `users`. It automatically marks existing registered users as verified (`isEmailVerified = true`) so active users are never locked out.

---

## 3. Running the Backend

```bash
# Start in development mode (hot reload):
npm run dev

# Run production build:
npm run build

# Start production server:
npm start
```

Interactive Swagger UI documentation is available at:
- `http://localhost:5000/docs`
- OpenAPI JSON specification: `http://localhost:5000/openapi.json`

---

## 4. Running Automated Tests

```bash
# Run all unit and integration tests:
npm test
```

Automated tests mock the Brevo delivery client to verify:
- Cryptographic 6-digit OTP generation and HMAC-SHA256 hashing.
- 5-minute expiry enforcement and 60-second cooldown period.
- 5-attempt limit and OTP locking.
- Single-use consumption and atomic replay prevention.
- Registration email verification and protected resource access gating.
- Generic response anti-enumeration on forgot password.
- Password reset, old password invalidation, and session token revocation (`tokenVersion`).

---

## 5. Authentication & Email Verification API Contracts

### 5.1. Registration (`POST /api/auth/register`)
- **Body:**
  ```json
  {
    "name": "Sahil Sojitra",
    "mobileNumber": "9825012345",
    "email": "broker@mybusiness.com",
    "password": "Password123",
    "businessName": "Sojitra Trade"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Registration successful. Please enter the 6-digit verification code sent to your email address.",
    "requiresVerification": true,
    "email": "broker@mybusiness.com",
    "user": {
      "id": "uuid",
      "name": "Sahil Sojitra",
      "mobileNumber": "9825012345",
      "email": "broker@mybusiness.com",
      "businessName": "Sojitra Trade",
      "isEmailVerified": false,
      "createdAt": "2026-10-25T12:00:00.000Z"
    }
  }
  ```

### 5.2. Verify Email (`POST /api/auth/verify-email`)
- **Body:**
  ```json
  {
    "email": "broker@mybusiness.com",
    "otp": "123456"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "user": {
      "id": "uuid",
      "name": "Sahil Sojitra",
      "mobileNumber": "9825012345",
      "email": "broker@mybusiness.com",
      "businessName": "Sojitra Trade",
      "isEmailVerified": true,
      "createdAt": "2026-10-25T12:00:00.000Z"
    },
    "token": "jwt-bearer-token"
  }
  ```

### 5.3. Resend OTP (`POST /api/auth/resend-otp`)
- **Body:**
  ```json
  {
    "email": "broker@mybusiness.com",
    "purpose": "EMAIL_VERIFICATION"
  }
  ```
- **Cooldown:** Subject to a 60-second cooldown period. Returns `429 Too Many Requests` if called too early.

### 5.4. Forgot Password (`POST /api/auth/forgot-password`)
- **Body:**
  ```json
  {
    "email": "broker@mybusiness.com"
  }
  ```
- **Response (200 OK):** Always returns generic message to prevent account enumeration:
  ```json
  {
    "success": true,
    "message": "If an account associated with this email address exists, a 6-digit password recovery code has been sent."
  }
  ```

### 5.5. Reset Password (`POST /api/auth/reset-password`)
- **Body:**
  ```json
  {
    "email": "broker@mybusiness.com",
    "otp": "123456",
    "newPassword": "NewSecurePassword456"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password has been reset successfully. You can now sign in with your new password."
  }
  ```
- **Session Revocation:** Increments user `tokenVersion`, invalidating all active JWT sessions issued before the reset.
