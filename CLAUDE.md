# CLAUDE.md

Standing context for working in this repository.

## What this is

A personal fork of [ampcast](https://github.com/rekkyrosso/ampcast), used **only** as a desktop
player (Electron, in `app/`) on Windows and Linux (Fedora, Debian, Ubuntu). There is no web app,
no Docker and no macOS build to support.

Main sources: **Emby** (primary), Jellyfin, Plex, Spotify and local files.

**Lossless playback matters.** FLAC should play direct from the server. Never add anything that
forces or defaults to transcoding (codec lists, bitrate caps, `PlayMethod` changes, etc.).

## Commands

- Type check: `npx tsc --noEmit -p .`
- Lint: `npx eslint <changed files>`
- Dev UI loop: `npm run build:dev`, then `npm run start:dev` (http://localhost:8000)
- Desktop app: `npm run build:electron` at the repo root, then in `app/`: `npm i` and `npm start`
  - npm 12 blocks git dependencies, and Electron comes from castlabs' GitHub releases, so a fresh
    install in `app/` needs `npm i --allow-git=root`.
- Packaging (in `app/`): `npm run build:win` / `npm run build:linux`
  (`rpm` and `deb` targets must be built on Linux)

## Workflow

- One branch per feature, merged into `main` through GitHub PRs on the fork
  (`origin` = tinycatsamurai/ampcast). Don't merge locally.
- `upstream` is rekkyrosso/ampcast. It is pulled from regularly, and nothing is ever pushed or
  opened as a PR there.
- **Keep the diff against upstream small**, so merges from upstream stay easy:
  - Prefer configuration, or hiding things, over deleting or rewriting shared code.
  - Deleting whole files that only matter for web/Docker/macOS is fine; heavy edits to core
    files are not.
  - If a change turns out bigger or riskier than expected, do the safe part and stop.

## Code style

- Prettier config is in the repo (`prettier.config.js`); TypeScript is strict.
- Run tsc and eslint on changed files before committing.
- `core.autocrlf` is on, so working-copy files have CRLF line endings and Prettier may flag them;
  check with LF content (`tr -d '\r' < file | npx prettier --stdin-filepath file --check`).
