const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("src/index.html");
  mainWindow.webContents.openDevTools();

  // Open DevTools in development
  if (process.env.NODE_ENV === "development") {
  }
}

// Handle notification requests
ipcMain.handle("show-notification", async (event, options) => {
  const { title, body, type = "info" } = options;

  let icon;
  switch (type) {
    case "success":
      icon = path.join(__dirname, "assets/success.png"); // You'll need to add these icons
      break;
    case "error":
      icon = path.join(__dirname, "assets/error.png");
      break;
    default:
      icon = path.join(__dirname, "assets/info.png");
  }

  new Notification({
    title,
    body,
    icon, // Optional: Add icons for different notification types
  }).show();
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
    console.log("activate");
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
