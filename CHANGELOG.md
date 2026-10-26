# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.2.0] - 2026-10-26

### Added

- **Family admin role.** The creator of a family is its admin: edit or archive tasks, rename the family, regenerate the invite code, remove members and reset a member's password with a one-time temporary password. When the admin leaves, the oldest member takes over; when the last member leaves, the family and its data are deleted.
- **Activity history** with undo (24 hours, current week) that also reverses coins and the pet's health.
- **Delete my account**, confirmed with the password. It removes messages, notifications, points and redemptions.
- **Weekly recap** saved before each ranking reset and shown on the Ranking screen.
- **Rewards store**: prizes defined by the admin and redeemed with the family's shared coins.
- Chat history is paginated (50 per page, "load earlier messages" button).
- `/health` endpoint and graceful shutdown.
- Versioned SQLite migrations (`schema_version`) and indexes on the lookup columns.
- ESLint with a lint job in CI, `expo-doctor` in CI and a Dependabot config (version updates for the frontend are off because Expo pins its packages; security updates stay on).
- 25 new backend tests (42 in total).

### Security

- Rate limiting on sign-up, login, invite codes, password change and account deletion.
- `helmet` headers and a CORS allow-list (`CORS_ORIGIN`; `localhost` only by default).
- The server refuses to start without a real `JWT_SECRET`.
- Invite codes use `crypto.randomInt` instead of `Math.random()`, and are case-insensitive when joining.
- The session token is stored in `expo-secure-store` on iOS and Android.

### Changed

- Deleting a task now archives it. Before, deleting a task that already had events failed with a server error because of a foreign key.
- Only the family admin can edit or delete tasks.
- The palettes were adjusted to meet WCAG AA contrast, buttons got roles and labels, and touch targets are at least 44 px. The app now follows the system light/dark setting on iOS and Android.
- `app.json` has an app version, a URL scheme and iOS/Android identifiers; `react-native-worklets` was added and `newArchEnabled` removed, as `expo-doctor` recommended.
- Dependencies updated within their semver ranges.
- Package metadata: MIT licence, `engines`, `.nvmrc`.

### Fixed

- Messages loaded from the server now carry `usuario_id`, so your own old messages are shown as yours after reopening the chat.

### Removed

- The obsolete `public/test.html` chat page.

## [0.1.1] - 2026-10-20

### Security

- The Socket.IO connection now requires a valid JWT, and a user can only join their own family's room. Before, any client that knew a family id could receive that family's chat messages in real time.

### Added

- 17 backend tests (auth, family isolation across 17 endpoints, Socket.IO) that run with `npm test` and in CI.

### Changed

- The client no longer hard-codes the API address: it derives it from the machine running Expo, or from `EXPO_PUBLIC_API_URL`.
- The backend port can be set with `PORT`.
- Updated the frontend lockfile: `npm audit` went from 34 advisories (1 critical) to 26 (none critical).
- New screenshots, taken from the running app.

### Fixed

- The bottom tab labels were cut off; the tab bar is taller.

## [0.1.0] - 2026-10-20

First tagged version.

### Added

- Family spaces joined with an invite code, with accounts using JWT sessions and bcrypt password hashes.
- Task catalogue of 53 predefined tasks plus custom tasks, with search and filters.
- Points and a weekly ranking that resets each week.
- Shared virtual pet with 6 species and 6 accessories in 3 categories, unlocked with coins.
- Activity notifications feed and local notifications.
- Real-time family chat over Socket.IO.
- Password change from the settings screen.
- Light, dark and automatic themes, and three font sizes.
- CI on GitHub Actions: backend syntax check and smoke test, frontend web export, and a warning-only `npm audit`.
- English README, Spanish README, security policy, and screenshots with fictitious data.

### Changed

- Backend split into routes, controllers and services, with middleware and one Zod schema per endpoint.
- Backend lockfile updated so `npm audit --omit=dev` reports no advisories.

### Known limitations

See the [README](README.md#known-limitations).

[Unreleased]: https://github.com/jmartintechit-blip/FamilyQuest/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/jmartintechit-blip/FamilyQuest/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/jmartintechit-blip/FamilyQuest/releases/tag/v0.1.0
