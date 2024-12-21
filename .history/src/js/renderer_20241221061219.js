import { toast } from "./utils/toast";

let connectionManager;
let inputHandler;
let queueManager;

document.addEventListener("DOMContentLoaded", () => {
  try {
    // Initialize managers
    const serverUrl = "http://your-signaling-server:3000";
    connectionManager = new ConnectionManager(serverUrl);
    inputHandler = new InputHandler(connectionManager.socket);
    queueManager = new QueueManager(connectionManager.socket);

    NotificationManager.showSuccess("Application initialized successfully");
  } catch (error) {
    NotificationManager.showError(
      `Failed to initialize application: ${error.message}`
    );
  }

  window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error("Global error:", error);
    NotificationManager.showError(`An unexpected error occurred: ${msg}`);
    return false;
  };

  // Add unhandled rejection handler
  window.onunhandledrejection = function (event) {
    console.error("Unhandled promise rejection:", event.reason);
    NotificationManager.showError(
      `An unexpected error occurred: ${event.reason.message}`
    );
  };

  // UI Elements
  const connectBtn = document.getElementById("connect-btn");
  const disconnectBtn = document.getElementById("disconnect-btn");
  const remoteScreen = document.getElementById("remote-screen");

 
connectBtn.addEventListener("click", async () => {
  try {
    notifications.info("Attempting to connect...");

    // Simulate connection delay (replace with actual connection logic)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Your connection logic will go here
    notifications.success("Successfully connected!");

    connectBtn.disabled = true;
    disconnectBtn.disabled = false;
  } catch (error) {
    notifications.error("Failed to connect: " + error.message);
    console.error("Connection error:", error);

    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
  }
});

disconnectBtn.addEventListener("click", () => {
  try {
    notifications.info("Disconnecting...");

    // Your disconnect logic will go here

    notifications.success("Successfully disconnected!");

    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
  } catch (error) {
    notifications.error("Failed to disconnect: " + error.message);
    console.error("Disconnect error:", error);
  }
});
  // Device disconnection handler
  document.addEventListener("deviceDisconnected", () => {
    inputHandler.stopControl();
    stopSessionTimer();
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
    document.getElementById("device-id").textContent = "-";
  });

  // Session start handler
  document.addEventListener("sessionStarted", (event) => {
    const { deviceId, duration } = event.detail;
    document.getElementById("device-id").textContent = deviceId;
    if (duration) {
      startSessionTimer(duration);
    }
  });
});

// Update session timer functionality
let sessionTimer;
let sessionEndTime;

function startSessionTimer(duration) {
  if (duration) {
    sessionEndTime = Date.now() + duration * 1000;
  }

  sessionTimer = setInterval(() => {
    const now = Date.now();
    if (sessionEndTime && now >= sessionEndTime) {
      connectionManager.handleDisconnect();
      return;
    }

    const elapsedSeconds = Math.floor(
      (now - (sessionEndTime - duration * 1000)) / 1000
    );
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    document.getElementById("session-time").textContent = `${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, 1000);
}

function stopSessionTimer() {
  if (sessionTimer) {
    clearInterval(sessionTimer);
    sessionTimer = null;
  }
  document.getElementById("session-time").textContent = "00:00";
  sessionEndTime = null;
}
