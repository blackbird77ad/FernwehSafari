# FernwehSafari Website

FernwehSafari is an Africa-Europe travel referral platform for European travellers discovering Tanzania and Zanzibar tours. Customers browse tours and submit enquiries on FernwehSafari, then get referred to the relevant tour partner's booking system.

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

## Demo Admin

The seed script creates:

- Email: `admin@fernwehsafari.com`
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
