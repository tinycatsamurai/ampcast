<p align="center">
  <img width="96px" src="./app/www/icon-192.png" alt="Ampcast"></img>
</p>

<h1 align="center">Ampcast</h1>

<p align="center">A music player inspired by Winamp.</p>

## Features

* Supports Plex, Jellyfin, Emby, iBroadcast, Navidrome and Subsonic (and variants)
* Additional support for Apple Music, Spotify, SoundCloud, Bandcamp and YouTube
* Built-in visualizers: Milkdrop (Butterchurn) and others
* Scrobbling for last.fm and ListenBrainz
* Playback from last.fm/ListenBrainz (via search of logged in services)
* ReplayGain / Lyrics
* Internet radio

## About this fork

A personal fork of [ampcast](https://github.com/rekkyrosso/ampcast), built only as a desktop
app for Windows and Linux. There is no web app, Docker image or macOS build.

## Building from source

Requires Node >= 24.

```bash
# install deps
npm i

# build the web view for the desktop app
npm run build:electron

# run the desktop app
cd ./app
npm i --allow-git=root   # first time only (Electron comes from castlabs' GitHub releases)
npm start
```

Package it (in `./app`):

```bash
npm run build:win     # NSIS installer + zip
npm run build:linux   # AppImage, deb, rpm, tar.xz (build on Linux)
```

To work on the UI in a browser, use the development environment and go to http://localhost:8000:

```bash
npm run build:dev
npm run start:dev
```

You can optionally create a `.env` file ([example](./.env.example)) to store API keys and other
config options (`.env.electron` for the desktop build).

## Contributing

I request that you only [open an issue](https://github.com/rekkyrosso/ampcast/issues) for submitting **bug reports**.

Please use the [**Discussions**](https://github.com/rekkyrosso/ampcast/discussions) section on GitHub to send **feature requests**, questions, suggestions or any other feedback.

There is also a [general discussion forum on reddit](https://www.reddit.com/r/ampcast).

## License

[GNU General Public License v3.0 ©](https://github.com/rekkyrosso/ampcast/blob/main/LICENSE)
