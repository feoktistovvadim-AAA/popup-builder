# Popup Rules Spec (Repo-Based)

This document describes the current rule schema, admin UI mapping, and pb.js evaluation logic as implemented in the repo. It also calls out gaps and mismatches.

## A) Schema / Config Structure

### DB storage
- Popup rules are stored in `PopupVersion.schema` (JSON).  
  Model: `PopupVersion` in `prisma/schema.prisma`

### Current schema shape (TypeScript)
From `src/lib/builder/schema.ts`:
```ts
export type PopupSchemaV2 = {
  schemaVersion: 2;
  blocks: PopupBlock[];
  template: { layout: LayoutSettings };
  triggers: Trigger[];
  triggersMode?: "any" | "all";
  frequency: FrequencyConfig;
  targeting: TargetingRule[];
};
```

### Blocks / layout
- `blocks[]`: `headline | text | button | image | spacer`
- `template.layout`: `padding`, `maxWidth`, `borderRadius`, `backgroundColor`, `overlayColor`, `animation`, `position`, `showClose`

### Triggers (supported types)
From `src/lib/builder/schema.ts`:
- `after_seconds { seconds }`
- `scroll_percent { percent }`
- `exit_intent_desktop { sensitivity? }`
- `custom_event { name }`
- `inactivity { seconds }`
- `pageview_count { count }`
- `url_match { pattern, match }`
- `device_is { device }`

Trigger contract (normalized in pb.js):
```
{ type: string, enabled?: boolean, params?: { ... } }
```
Legacy fields (`seconds`, `eventName`, `pattern`, `device`, `count`) are still accepted for backward compatibility.

### Targeting (supported types)
From `src/lib/builder/schema.ts`:
- `vip_level_is { value }`
- `balance_lt { amount }`
- `device_is { device }`
- `url_contains { value }`
- `new_vs_returning { value: "new" | "returning" }`
- `sessions_count { count }`
- `referrer_contains { value }`

### Frequency
From `src/lib/builder/schema.ts`:
- `maxPerSession`
- `maxPer24h`
- `cooldownAfterCloseHours`
- `showOnce`
- `perCampaign`

## B) Admin UI Mapping (Inspector Panel)

Source: `src/components/builder/InspectorPanel.tsx`

### Triggers UI
- `after_seconds`: number input for `seconds`
- `scroll_percent`: number input for `percent`
- `exit_intent_desktop`: number input for `sensitivity`
- `custom_event`: input for `name`
- `inactivity`: number input for `seconds`
- `pageview_count`: number input for `count`
- `url_match`: input for `pattern` + match selector
- `device_is`: select `desktop|mobile`

Defaults
- New trigger defaults to `{ type: "after_seconds", seconds: 5 }`
- No validation beyond input type (number/text)

### Targeting UI
Each rule renders fields based on type:
- `vip_level_is`: input `value`
- `balance_lt`: input `amount` (number)
- `device_is`: select `desktop|mobile`
- `url_contains`: input `value`
- `new_vs_returning`: select `new|returning` (uses `value`)
- `sessions_count`: input `count` (number)
- `referrer_contains`: input `value`

Defaults
- New rule defaults to `{ type: "url_contains", value: "" }`
- No validation beyond input type (number/text)

### Frequency UI
- `maxPerSession`: number
- `maxPer24h`: number
- `cooldownAfterCloseHours`: number
- `showOnce`: checkbox
- `perCampaign`: checkbox

### Layout UI
Fields are editable from Layout panel. No validation beyond input types.

## C) Client Execution Mapping (pb.js)

Source: `public/pb.js`

### Targeting evaluation (implemented)
From `matchesTargeting()`:
- `device_is`: compares to `window.innerWidth <= 768 ? "mobile" : "desktop"`
- `url_contains`: `window.location.href.includes(value)`
- `referrer_contains`: `document.referrer.includes(value)`
- `vip_level_is`: uses `window.pbSettings.userContext.vipLevel`
- `balance_lt`: compares `userContext.balance`
- `new_vs_returning`: compares `userContext.userType` ("new" default)
- `sessions_count`: compares `userContext.sessionsCount`

### Targeting missing or partial
None missing from list above, but **no operators** (contains vs equals) and no normalization.

### Trigger evaluation (implemented)
From `setupTriggers()` + `runTriggers()`:
- `after_seconds`: `setTimeout` with `seconds`
- `scroll_percent`: listens to `scroll`, checks percent
- `exit_intent_desktop`: listens to `mouseout` with `clientY <= sensitivity`
- `custom_event`: listens for `window.addEventListener(name)` and `pb:name`
- `inactivity`: timer resets on activity (mousemove, keydown, scroll, touchstart)
- `pageview_count`: stored in `localStorage` per `siteId`
- `url_match`: match against `location.href` with contains/equals/regex
- `device_is`: compares against viewport width

### Frequency evaluation (implemented)
From `canShowByFrequency()`:
- `showOnce`: blocks after first show (stored in localStorage)
- `maxPer24h`: tracked via `lastDay` + `shown24h`
- `cooldownAfterCloseHours`: tracked via `lastClosed`
- `maxPerSession`: uses `sessionStorage`
- `perCampaign`: scope keys by popupId+versionId or popupId

LocalStorage keys:
- `pb_freq_${popupId}_${versionId}` when `perCampaign=true`
- `pb_freq_${popupId}` when `perCampaign=false`
- Session key: `${key}_session`

### Rendering
`renderPopup()` uses `schema.blocks` and `template.layout`. Rendering is executed in pb.js for popups returned by `/api/v1/boot` (rules) and `/api/v1/decision` (schema).

## D) Boot/Decision Pipeline

### `/api/v1/boot`
Source: `src/app/api/v1/boot/route.ts`
- Public endpoint (no auth).
- Input: `siteId` query param.
- Returns popups for that site with latest published version.
- Response fields:
  - `siteId`
  - `popups[]: { id, versionId, status: "active", rules: version.schema }`
- Multi-tenant safety: uses `siteId` boundary only.

### `/api/v1/decision`
Source: `src/app/api/v1/decision/route.ts`
- Accepts `{ siteId, userContext }` in POST body.
- Returns `popups[]` with `{ popupId, versionId, schema }`.
- No targeting or trigger evaluation on server.

### Client usage
- pb.js calls `/api/v1/boot` and evaluates triggers/targeting/frequency before rendering.
- pb.js still supports legacy `/api/v1/decision` response shape.

## E) Rules Spec Tables

### Triggers
| type | UI fields | stored JSON fields | runtime data used | evaluation | status |
| --- | --- | --- | --- | --- | --- |
| after_seconds | seconds | { type, params.seconds } | `setTimeout` | render after N seconds | working |
| scroll_percent | percent | { type, params.percent } | `window.scrollY`, document height | render once percent reached | working |
| exit_intent_desktop | sensitivity | { type, params.sensitivity } | `mouseout` + `clientY` | render on exit intent | working |
| custom_event | name | { type, params.name } | `window.addEventListener` | render on custom event | working |
| inactivity | seconds | { type, params.seconds } | activity listeners | render after idle seconds | working |
| pageview_count | count | { type, params.count } | `localStorage` | render once count >= N | working |
| url_match | pattern + match | { type, params.pattern, params.match } | `location.href` | contains/equals/regex | working |
| device_is | device | { type, params.device } | viewport width | render if matches | working |

### Targeting
| type | UI fields | stored JSON fields | runtime data used | evaluation | status |
| --- | --- | --- | --- | --- | --- |
| vip_level_is | value | { type, value } | `userContext.vipLevel` | equality | working |
| balance_lt | amount | { type, amount } | `userContext.balance` | numeric `<` | working |
| device_is | device | { type, device } | viewport width | equality | working |
| url_contains | value | { type, value } | `location.href` | substring contains | working |
| new_vs_returning | value | { type, value } | `userContext.userType` | equality | working |
| sessions_count | count | { type, count } | `userContext.sessionsCount` | `>=` | working |
| referrer_contains | value | { type, value } | `document.referrer` | substring contains | working |

### Frequency
| rule | UI fields | stored JSON fields | runtime data used | evaluation | status |
| --- | --- | --- | --- | --- | --- |
| maxPerSession | number | `maxPerSession` | `sessionStorage` | block if >= | working |
| maxPer24h | number | `maxPer24h` | `localStorage` + `lastDay` | block if >= | working |
| cooldownAfterCloseHours | number | `cooldownAfterCloseHours` | `localStorage.lastClosed` | block if within hours | working |
| showOnce | checkbox | `showOnce` | `localStorage.shown` | block after first | working |
| perCampaign | checkbox | `perCampaign` | key scope | key by version or popup | working |

## F) Mismatches / Missing Pieces

High priority:
1. **No operators** for targeting (e.g. referrer equals vs contains). Only contains is supported.

Recommended follow-up steps (separate PR):
- Add optional operator fields for targeting (referrer/url).
