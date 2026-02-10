# Rules Test Plan

This is a manual test plan for triggers, targeting, and frequency rules. It assumes a published popup with a simple headline and button.

## Preconditions
1. Create a Site and Popup in `/admin`.
2. Open the builder and publish the popup.
3. Embed the widget on a test page with:
   ```html
   <script>
     window.pbSettings = {
       siteId: "SITE_ID",
       apiBase: "https://your-domain",
       debug: true
     };
   </script>
   <script async src="https://your-domain/pb.js"></script>
   ```
4. Open DevTools Console and confirm `[PB][trigger]` logs.

## Trigger Tests

### after_seconds
1. Set trigger to `after_seconds` = 1.
2. Reload the page.
3. Expect popup after 1 second.
4. Console: verify `[PB] boot loaded` log.

### scroll_percent
1. Set `scroll_percent` = 10.
2. Reload page, scroll a little.
3. Expect popup after reaching 10% scroll.

### exit_intent_desktop
1. Set trigger to `exit_intent_desktop`.
2. Set sensitivity to `10`.
2. Move mouse to top of viewport (outside page).
3. Expect popup.

### custom_event
1. Set trigger to `custom_event` with `name = deposit_failed`.
2. In DevTools console, run:
   ```js
   window.dispatchEvent(new Event("deposit_failed"))
   ```
3. Expect popup to render.
4. Also verify:
   ```js
   window.pbTrack("deposit_failed")
   ```

### inactivity
1. Set trigger to `inactivity` with `seconds = 3`.
2. Reload the page and do not move the mouse or press keys.
3. Expect popup after ~3 seconds.

### pageview_count
1. Set trigger to `pageview_count` with `count = 2`.
2. Reload the page twice.
3. Expect popup on second load.

### url_match
1. Set trigger to `url_match` with pattern `test-page` and match `contains`.
2. Open a URL containing `test-page`. Expect popup.
3. Switch match to `equals` and use the exact URL.
4. Switch match to `regex` with pattern `test-.*`.

### device_is (trigger)
1. Set trigger to `device_is = desktop`.
2. Open on desktop: popup should show immediately.
3. Emulate mobile: popup should not show.

## Targeting Tests

### device_is
1. Set targeting to `device_is = desktop`.
2. Verify on desktop: popup should show.
3. Emulate mobile in DevTools device toolbar: popup should not show.

### url_contains
1. Set `url_contains = test-page`.
2. Open a URL that contains `test-page`. Expect popup.
3. Open a URL without it. Expect no popup.

### referrer_contains
1. Set `referrer_contains = google`.
2. Open test page from a Google referrer (or simulate by navigating from a page with that referrer).
3. Expect popup only when referrer matches.

### vip_level_is
1. Set targeting to `vip_level_is = gold`.
2. In snippet, set `userContext: { vipLevel: "gold" }`.
3. Expect popup. Change to `silver`, expect no popup.

### balance_lt
1. Set `balance_lt = 50`.
2. Use `userContext: { balance: 40 }` → popup shows.
3. Use `userContext: { balance: 60 }` → popup does not show.

### new_vs_returning
1. Set `new_vs_returning = new`.
2. Use `userContext: { userType: "new" }` → popup shows.
3. Use `userContext: { userType: "returning" }` → popup does not show.

### sessions_count
1. Set `sessions_count = 3`.
2. Use `userContext: { sessionsCount: 3 }` → popup shows.
3. Use `userContext: { sessionsCount: 2 }` → popup does not show.

## Frequency Tests

### showOnce
1. Enable `showOnce`.
2. Reload page: popup should show once.
3. Reload again: popup should not show.

### maxPerSession
1. Set `maxPerSession = 1`.
2. Reload page; popup shows.
3. Reload again in same tab; popup should not show.

### maxPer24h
1. Set `maxPer24h = 1`.
2. Show popup once, reload; popup should not show.
3. Clear localStorage or wait 24h to reset.

### cooldownAfterCloseHours
1. Set `cooldownAfterCloseHours = 1`.
2. Show popup, click close.
3. Reload; popup should not show for 1 hour.

### perCampaign
1. Enable `perCampaign`.
2. Publish a new version of the popup.
3. Popup should show again because key changes to version id.

## Debug Logging

Use `window.pbSettings.debug = true` to log:
- Boot data received
- Targeting evaluation per rule
- Trigger evaluation path
- Frequency decision and key

Suggested format:
```
[PB] debug targeting { rule, result }
[PB] debug trigger { type, result }
[PB] debug frequency { key, data, allowed }
```

## Preset Quick Test
1. Open a popup in the builder and click **Save as preset**.
2. Go to `/admin/popups` → **From preset**.
3. Select the preset and choose import options.
4. Create and verify the new popup opens in the builder with imported sections.
