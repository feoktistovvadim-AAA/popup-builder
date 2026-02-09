# Popup Builder Architecture

## Data Model (high level)
```mermaid
erDiagram
  User ||--o{ Membership : joins
  Organization ||--o{ Membership : has
  Organization ||--o{ Site : owns
  Site ||--o{ Popup : contains
  Popup ||--o{ PopupVersion : versions
  Popup ||--o{ PopupEvent : events
  User ||--o{ Account : oauth
  User ||--o{ Session : sessions
  Organization ||--o{ Invite : invites
```

## Popup Delivery Flow
```mermaid
sequenceDiagram
  participant Client
  participant PB as PB_JS
  participant API as API
  participant DB as Database

  Client->>PB: PB.init(siteId,userContext)
  PB->>API: POST /api/v1/decision
  API->>DB: Fetch published popup versions
  DB-->>API: Popup schema v2
  API-->>PB: {popups:[schema]}
  PB->>Client: Evaluate targeting + triggers
  PB->>Client: Render popup in ShadowDOM
  PB->>API: POST /api/v1/event
```

## API Surface
- `POST /api/v1/decision` returns published popup schemas.
- `POST /api/v1/event` logs events (impression, click, close).
- `POST /api/v1/upload` stores images in `public/uploads`.

## Builder Schema v2
```json
{
  "schemaVersion": 2,
  "blocks": [],
  "template": { "layout": {} },
  "triggers": [],
  "frequency": {},
  "targeting": []
}
```
