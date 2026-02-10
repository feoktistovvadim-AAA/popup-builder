# Dev Brief

Single source of truth for core flows and integration contracts.

## Auth + Org Context
- Session context derives from `pb_active_org` cookie.
- If missing or invalid, first membership is used.
- If user has zero memberships, org + OWNER membership is auto-created.
- `getOrgContext()` lives in `src/lib/org.ts`.

## Data Model: Site → Popup
- `Organization` has many `Site`.
- `Site` has many `Popup`.
- `Popup` has many `PopupVersion` (schema snapshots).
- Popup rules are stored in `PopupVersion.schema` (JSON).

## /api/v1/boot (Public)
- Route: `src/app/api/v1/boot/route.ts`
- Input: `GET /api/v1/boot?siteId=...`
- CORS: `Access-Control-Allow-Origin: *` and OPTIONS support.
- Response:
  - `siteId`
  - `popups[]: { id, versionId, status, rules }`
- `rules` is the published popup schema (blocks/template/triggers/targeting/frequency).
- Uses `siteId` as tenant boundary; no cookies or auth.
- Cache headers: `Cache-Control: public, max-age=60, stale-while-revalidate=300`.

## public/pb.js
- Boot flow:
  - Reads `window.pbSettings.siteId` (required).
  - Uses `window.pbSettings.apiBase` or pb.js script origin for API base.
  - Fetches `/api/v1/boot` and renders eligible popups.
- Trigger engine:
  - All schema trigger types are supported with params normalization.
  - Modes: `triggersMode = "any" | "all"` (default any).
  - Debug logs prefix: `[PB][trigger]` when `pbSettings.debug === true`.
- Debug HUD:
  - Shows popups count, popupId/versionId, last trigger, blocked reason.
  - Only when `pbSettings.debug === true`.
- Custom events:
  - `window.pbTrack(name, payload)` dispatches `pb:name`.
  - `custom_event` triggers listen to `pb:<name>` and raw event name.

## Installation Snippet
- Must use absolute `pb.js` URL and provide `apiBase`.
- Snippet:
  ```
  <script>
    window.pbSettings = { siteId: "SITE_ID", apiBase: "https://your-domain" };
  </script>
  <script async src="https://your-domain/pb.js"></script>
  ```
- Works in `<head>` or GTM Custom HTML.

## Environment Variables
- `NEXT_PUBLIC_WIDGET_ORIGIN` (preferred pb.js + apiBase origin)
- `NEXT_PUBLIC_APP_URL` (fallback origin)
- `DATABASE_URL` (Neon Postgres)
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Known Pitfalls
- `custom_event` requires `pbTrack()` or `window.dispatchEvent`.
- Frequency can block popups if localStorage/sessionStorage already contains keys.
- `/api/v1/boot` is cached; recently published popups may take up to 60s.
- If `apiBase` is missing, external sites will request boot from their own domain.
