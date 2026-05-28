---
title: "Onboarding Claude Code to a Real Codebase: What /init Gets Right, and What You Still Have to Teach It"
description: "A practitioner walk-through of running /init on a real Express API and reading the auto-generated CLAUDE.md critically — what it picked up on its own, and the three things I had to add by hand."
date: 2026-05-28
tags: ["claude-code", "ai-workflows", "developer-tools", "productivity"]
draft: false
---

If you've watched the AI coding tool space for the last year, you've probably developed a healthy skepticism. Autocomplete-on-steroids is fine. But every senior engineer I know eventually hits the same wall: the tool doesn't understand the *project*. It hallucinates module paths, ignores your build system, and confidently rewrites the one file with a load-bearing comment that says "do not refactor."

Claude Code takes a different shape. It's a terminal-native agent that runs in your repo, reads your code, runs your commands, and — critically — onboards itself via a file called `CLAUDE.md` that you generate with a single command: `/init`.

This post is a concrete walk-through. Install it, point it at a real codebase, run `/init`, and look at what it produces. No toy examples.

## Why a developer would want this

The pitch isn't "write your code for you." After twenty years of writing software, I don't want that. The pitch is more like: a junior teammate who has read the entire codebase before you say good morning, can run the build, can grep for the thing you half-remember, and will draft a PR you can review in five minutes.

Three things set Claude Code apart from IDE-integrated assistants:

1. **It lives in the terminal** — a process, not a plugin, so it works with whatever editor you already use.
2. **It's agentic** — it runs commands, reads files, executes tests, and iterates without you copy-pasting between a chat window and your editor.
3. **It learns your project once** — a `CLAUDE.md` at the repo root is loaded into every session, so you teach it your conventions once instead of every conversation.

The third point is what `/init` bootstraps for you.

## Installation

The install is unceremonious. On macOS or Linux:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Homebrew works too:

```bash
brew install --cask claude-code
```

Then authenticate against your Claude account (Pro, Max, Team, Enterprise, or Console):

```bash
claude
```

The first run opens a browser, you log in, and you're back at the prompt. That's the entire setup.

## Running /init on a real repo

Let's point it at something familiar but non-trivial: a generic Express REST API at `~/code/sample-api`. Nothing exotic — `express` 4, a handful of route modules under `src/routes/`, auth middleware in `src/middleware/auth.js`, a thin Postgres wrapper in `src/db.js`, Jest tests, nodemon in dev, and a `.env.example` listing `DATABASE_URL`, `PORT`, and `JWT_SECRET`. The kind of repo where a new engineer would still need a half-day of context to be useful.

```bash
cd ~/code/sample-api
claude
> /init
```

Claude Code starts exploring. You can watch it work: it reads `package.json`, walks `src/`, opens the route modules to see how they're mounted, peeks at the middleware, scans the `tests/` directory, and looks at recent commits. It's doing what you would do on day one — but in a minute or two.

When it finishes, it drops a `CLAUDE.md` at the repo root.

## What it actually wrote

Here's a representative chunk of what `/init` produced for the Express API:

```markdown
## What this is

A REST API built on Express 4 and Node 20. Routes are mounted under
`/api/v1` and persisted to Postgres via a thin wrapper in `src/db.js`.

## Build and run

npm install              # install dependencies
npm run dev              # nodemon, reloads on src/ changes
npm test                 # jest, runs unit + integration suites
npm run migrate          # apply pending SQL migrations in db/migrations/

## Key constraints

- **Route registration**: all routers are mounted in `src/routes/index.js`.
  New endpoints must be added there or they won't be reachable.
- **Middleware order matters**: `auth` must run after `requestId` and
  before any route that reads `req.user`. See `src/app.js`.
- **DB access**: never import `pg` directly in route handlers. Use the
  `query` helper in `src/db.js` so connection pooling and logging stay
  consistent.
```

A few things to notice:

- It picked up the **middleware ordering rule** — a classic Express footgun — by reading `src/app.js` and noticing that `req.user` is referenced downstream of `auth`.
- It identified the **`db.js` indirection** by spotting that no route file imports `pg` directly and inferring the convention.
- It correctly traced the **route mounting pattern** through `src/routes/index.js` and surfaced it as a rule a contributor needs to know.

These are the things a human onboarding doc would say. The tool wrote them on its own.

## What it missed (and how to fix it)

`/init` is a starting point, not a finished doc. On this repo, the generated file missed three things I cared about:

1. **The logging story.** It saw `pino` in the dependencies but didn't surface that logs go to stdout in dev and a file in prod, controlled by `LOG_LEVEL`. Future-me wants to know which knob to turn when debugging.
2. **The integration-test database.** Tests assume a Postgres at `localhost:5432`. The repo ships a `docker-compose.yml` with a `db` service — `docker compose up db` before `npm test` — but `/init` didn't connect those dots.
3. **The legacy `/v0` routes.** There's a `src/routes/legacy/` folder still wired up for one external partner. Without a note, a future session might "clean it up" and break a production integration.

The fix takes two minutes. Open `CLAUDE.md`, add the missing context, commit it. From that point forward, every Claude Code session in this repo starts with that knowledge in context.

```markdown
## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `JWT_SECRET` | yes | HS256 signing secret for auth tokens |
| `PORT` | no | Defaults to 3000 |
| `LOG_LEVEL` | no | `info` in prod, `debug` in dev |
```

That table didn't come from `/init`. I added it after the second session where Claude asked me which env vars the app needed. The rule of thumb: **anytime you find yourself explaining the same thing twice, it belongs in `CLAUDE.md`.**

## Takeaways

If you're going to try Claude Code on an existing codebase, do these three things in this order:

- **Install it and run `/init` in your real repo, not a sandbox.** The interesting friction shows up on real code.
- **Read the generated `CLAUDE.md` critically.** Treat it as a draft onboarding doc written by a fast-but-new teammate. Add what's missing.
- **Update `CLAUDE.md` every time you correct Claude on a project convention.** A week of small edits turns it into the doc you wish your repo always had.

The real surprise isn't that `/init` writes a good first draft. It's that the file ends up being useful to humans too. The next engineer who joins your team will read `CLAUDE.md` before they read the README — and they'll be better off for it.
