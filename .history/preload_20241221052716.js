const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  connectToDevice: (deviceId) =>
    ipcRenderer.invoke("connect-to-device", deviceId),
  disconnectFromDevice: () => ipcRenderer.invoke("disconnect-from-device"),
  getServerConfig: () => ipcRenderer.invoke("get-server-config"),
});
