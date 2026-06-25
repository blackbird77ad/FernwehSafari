# Travellex Website

Travellex is an Africa-focused travel, tour and adventure platform. Customers browse curated routes, submit enquiries, and continue to the selected tour booking page when ready. The current strongest destination coverage is Tanzania and Zanzibar, with the platform built to grow into broader African travel experiences.

## Stack

- Frontend: React, Vite, React Router v6, Axios
- Backend: Node.js, Express, MongoDB Atlas, Mongoose
- Auth: JWT with bcryptjs password hashing
- Images: Cloudinary uploads from the admin panel
- Email: Resend enquiry notifications
- Hosting targets: Cloudflare Pages for frontend, Render for backend

## Folder Structure

```text
Frontend/
  src/components/
  src/context/
  src/hooks/
  src/pages/
  src/services/
  src/utils/
Backend/
  src/config/
  src/controllers/
  src/lib/
  src/middleware/
  src/models/
  src/routes/
  src/data/seed.js
```

## Local Setup

Install dependencies:

```bash
npm run install:all
```

Create environment files:

```bash
Copy-Item Backend/.env.example Backend/.env
Copy-Item Frontend/.env.example Frontend/.env
```

Set `MONGO_URI` and `JWT_SECRET` in `Backend/.env`. Cloudinary and Resend keys can be added later; the upload/email features will report configuration errors until those keys exist.

Seed demo data after MongoDB is configured:

```bash
npm --prefix Backend run seed
```

Run the backend:

```bash
npm run dev:backend
```

Run the frontend:

```bash
npm run dev:frontend
```

Default URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000/api`
- Production domain: `https://travellex.tours`
- Cloudflare Pages host: `https://fernwehsafari.pages.dev`

## Render Backend Deployment

Render does not read `Backend/.env` from your computer, and this repo intentionally ignores real `.env` files. Add the backend variables in the Render service dashboard under **Environment**.

Required:

```text
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/travellex?retryWrites=true&w=majority
JWT_SECRET=<long-random-production-secret>
CLIENT_URL=https://travellex.tours
CLIENT_ORIGINS=https://travellex.tours,https://www.travellex.tours,https://fernwehsafari.pages.dev
```

Optional, depending on enabled features:

```text
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
MONGO_DNS_SERVERS=
```

For Render, the backend service should use:

```text
Root Directory: Backend
Build Command: npm install
Start Command: npm start
```

If MongoDB Atlas rejects the connection after `MONGO_URI` is set, add Render's outbound access to Atlas Network Access, or allow access from `0.0.0.0/0` if that matches your security policy.

## Demo Admin

The seed script creates:

- Email: `admin@travellex.tours`
- Password: `AdminPass123`

For production, create admin accounts manually in MongoDB Atlas and set `role` to `admin`.

## API Envelope

Success:

```json
{ "success": true, "data": {} }
```

Error:

```json
{ "success": false, "message": "..." }
```
