const {contextBridge, ipcRenderer, webUtils} = require('electron');

contextBridge.exposeInMainWorld('ampcastElectron', {
    quit: () => ipcRenderer.send('quit'),
    disableLoopbackAudio: () => ipcRenderer.invoke('disable-loopback-audio'),
    enableLoopbackAudio: () => ipcRenderer.invoke('enable-loopback-audio'),
    getCredential: (key) => ipcRenderer.invoke('getCredential', key),
    setCredential: (key, value) => ipcRenderer.invoke('setCredential', key, value),
    clearCredentials: () => ipcRenderer.invoke('clearCredentials'),
    setFontSize: (fontSize) => ipcRenderer.send('setFontSize', fontSize),
    setFrameColor: (color) => ipcRenderer.send('setFrameColor', color),
    setFrameTextColor: (color) => ipcRenderer.send('setFrameTextColor', color),
    getLocalhostIP: () => ipcRenderer.invoke('getLocalhostIP'),
    getPreferredPort: () => ipcRenderer.invoke('getPreferredPort'),
    setPreferredPort: (port) => ipcRenderer.invoke('setPreferredPort', port),
    // Replaces the removed `File.path` (empty string if the file isn't on disk).
    getPathForFile: (file) => webUtils.getPathForFile(file),
});
