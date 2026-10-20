# Security policy

FamilyQuest is a portfolio project that you run on your own machine. There is no hosted service and no real customer data. Reports are still welcome.

## Supported versions

| Version        | Supported |
| -------------- | --------- |
| `main` branch  | Yes       |
| 0.1.x          | Yes       |
| Anything older | No        |

## Reporting a vulnerability

Please do not describe a vulnerability in a public issue.

- Use GitHub's private reporting: **Security** tab, then **Report a vulnerability**.
- If that button is not there, open an issue that only says you have a security report and asks for a private channel. Leave out the details.

You can expect a first answer within a week. There is no bounty.

## Scope

In scope: the code in this repository.

Out of scope: denial of service by volume, social engineering, and anything that needs access to the machine where the server runs.

## What is not a new finding

These are already known and listed in the README under [Known limitations](README.md#known-limitations). Please check it before reporting:

- The Socket.IO connection is not authenticated.
- There is no rate limiting or security-header middleware, and CORS is open.
- The server starts without `JWT_SECRET` and login then fails.
- The advisories that `npm audit` reports in the frontend's Expo tooling.
- Using the placeholder `JWT_SECRET` from `backend/.env.example`: change it.
