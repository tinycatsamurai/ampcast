import {debounceTime} from 'rxjs';
import AmpcastElectron from 'types/AmpcastElectron';
import {browser, LiteStorage} from 'utils';

const ampcastElectron: AmpcastElectron | undefined = browser.isElectron
    ? (globalThis as any)['ampcastElectron']
    : undefined;

// Chromium writes localStorage to disk lazily, so recent changes (e.g. the theme)
// can be lost if the app doesn't exit cleanly. Ask the app to save them.
if (ampcastElectron?.flushStorageData) {
    LiteStorage.observeWrite()
        .pipe(debounceTime(1000))
        .subscribe(() => ampcastElectron.flushStorageData());
}

export default ampcastElectron;
