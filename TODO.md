# TODO - Fix loading screen / splash behavior

- [ ] Update app-level splash/logo loading visuals
  - [ ] Modify `App.js` to replace the default ActivityIndicator-only loader with a branded full-screen splash using `assets/icon.png`.
  - [ ] Ensure loader matches portrait splash look and avoids Expo default UI lingering.
- [ ] Validate Expo config
  - [ ] Confirm `app.json` splash + icon use correct assets (`assets/splash.png` and `assets/icon.png`).
  - [ ] If needed, adjust `app.json` splash background/resize to better match desired look.
- [ ] Run quick checks
  - [ ] `npm test` / `npm run lint` (if available) or at least `npm run start` to ensure no syntax errors.


