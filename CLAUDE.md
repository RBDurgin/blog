# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal Astro blog deployed to GitHub Pages at `https://rbdurgin.github.io/blog`. Posts are Markdown files in `src/content/posts/` rendered via Astro's content collections.

## Commands

```bash
npm run dev      # start dev server (localhost:4321)
npm run build    # production build → dist/
npm run preview  # preview the built dist/ locally
```

There is no test suite and no linter configured.

## Architecture

- **`astro.config.mjs`** — sets `site` + `base: '/blog'` (required for correct asset/link paths on GitHub Pages)
- **`src/content/config.ts`** — defines the `posts` collection schema (Zod): `title`, `description` (non-empty), `date`, `tags[]`, `draft` (defaults `true`)
- **`src/pages/index.astro`** — lists all non-draft posts sorted newest-first
- **`src/pages/posts/[...slug].astro`** — renders individual post pages via `getStaticPaths`
- **`.github/workflows/deploy.yml`** — builds and deploys `main` to GitHub Pages on every push

## Adding a post

Create `src/content/posts/<slug>.md` with frontmatter:

```yaml
---
title: "Post title"
description: "Non-empty description"
date: 2026-05-18
tags: [ai, engineering]
draft: false   # omit or set true to keep hidden
---
```

Posts with `draft: true` (the default) are excluded from both the index and static paths — they are not built at all.
