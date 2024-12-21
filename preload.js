const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  showNotification: (options) =>
    ipcRenderer.invoke("show-notification", options),
  connectToDevice: (deviceId) =>
    ipcRenderer.invoke("connect-to-device", deviceId),
  disconnectFromDevice: () => ipcRenderer.invoke("disconnect-from-device"),
});
