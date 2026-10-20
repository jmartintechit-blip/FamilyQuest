# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
