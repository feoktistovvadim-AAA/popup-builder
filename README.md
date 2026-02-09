# Popup Builder SaaS

Production-ready popup platform for iGaming teams. Build popups visually, configure targeting and triggers, publish versions, and embed `pb.js` on any site.

## Tech Stack
- Next.js 16 (App Router) + TypeScript
- Prisma + PostgreSQL (Neon compatible)
- NextAuth (Google + Credentials) with JWT sessions
- TailwindCSS + dnd-kit

## Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment variables
Ensure `.env` includes the following keys:
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=replace_this_with_random_secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 3) Run Prisma migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```
If you already have data in your Neon database, reset the schema first:
```bash
npx prisma migrate reset
```

### 4) Start the dev server
```bash
PORT=3001 npm run dev
```

Open `http://localhost:3001`.

## Core URLs
- Admin: `/admin`
- Sites: `/admin/sites`
- Popups: `/admin/popups`
- Builder: `/admin/popups/[popupId]/builder`
- API decision: `POST /api/v1/decision`
- Uploads: `POST /api/v1/upload`

## pb.js embed
```html
<script src="https://your-domain.com/pb.js"></script>
<script>
  PB.init({ siteId: "SITE_ID", userContext: {} })
</script>
```

### Manual install test
1. Go to `/admin/sites` and click **Install code** on a site.
2. Copy the Direct embed snippet and paste into a test page `<head>`.
3. Load the page and check the console for `[PB] boot loaded`.

## Notes
- Uploads are stored in `public/uploads`.
- Use Neon Postgres for production.
