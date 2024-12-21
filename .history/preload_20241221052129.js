const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Add methods that will be available to renderer process
  connectToDevice: (deviceId) =>
    ipcRenderer.invoke("connect-to-device", deviceId),
  disconnectFromDevice: () => ipcRenderer.invoke("disconnect-from-device"),
  // Add more methods as needed
});
