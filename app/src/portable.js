import {app} from 'electron';
import fs from 'node:fs';
import path from 'node:path';

// Windows zip builds keep their data (settings, credentials, local storage, etc.)
// in a `data` folder next to `ampcast.exe` instead of `%APPDATA%\ampcast`.
// This module must be imported before anything that uses the `userData` path
// (electron-store, the single instance lock, etc.).

function setupPortable() {
    if (process.platform !== 'win32' || !app.isPackaged) {
        return false;
    }
    const appDir = path.dirname(app.getPath('exe'));
    if (fs.existsSync(path.join(appDir, `Uninstall ${app.getName()}.exe`))) {
        return false; // Installed by the NSIS installer.
    }
    const dataDir = path.join(appDir, 'data');
    try {
        fs.mkdirSync(dataDir, {recursive: true});
        // Check that we can actually write here (e.g. not under "Program Files").
        const probe = path.join(dataDir, '.write-test');
        fs.writeFileSync(probe, '');
        fs.rmSync(probe);
    } catch (err) {
        console.warn(`Portable data folder not writable, using default: ${dataDir}`, err);
        return false;
    }
    app.setPath('userData', dataDir);
    app.setAppLogsPath(path.join(dataDir, 'logs'));
    return true;
}

const isPortable = setupPortable();

export default isPortable;
