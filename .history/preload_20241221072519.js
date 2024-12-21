const { contextBridge, ipcRenderer } = require("electron");

// Don't require socket.io-client directly in preload
contextBridge.exposeInMainWorld("electronAPI", {
  showNotification: (options) =>
    ipcRenderer.invoke("show-notification", options),
  connectToDevice: (deviceId) =>
    ipcRenderer.invoke("connect-to-device", deviceId),
  disconnectFromDevice: () => ipcRenderer.invoke("disconnect-from-device"),
});
