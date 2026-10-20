# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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

[Unreleased]: https://github.com/jmartintechit-blip/FamilyQuest/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jmartintechit-blip/FamilyQuest/releases/tag/v0.1.0
