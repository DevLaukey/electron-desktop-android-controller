const { contextBridge, ipcRenderer } = require('electron');
const { io } = require('socket.io-client');

// Expose any needed Node.js functionality to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
    showNotification: (options) => ipcRenderer.invoke('show-notification', options),
    connectToDevice: (deviceId) => ipcRenderer.invoke('connect-to-device', deviceId),
    disconnectFromDevice: () => ipcRenderer.invoke('disconnect-from-device'),
    // Add Socket.IO functionality if needed
    createSocket: (url) => io(url)
});