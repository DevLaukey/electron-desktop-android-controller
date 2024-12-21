
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

  // Connect button handler
  connectBtn.addEventListener("click", async () => {
    try {
      toast.info("Attempting to connect...");
      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      connectBtn.disabled = true;
      NotificationManager.showInfo("Connecting to device...");

      await connectionManager.initializeConnection();
      inputHandler.startControl();
      startSessionTimer();

      disconnectBtn.disabled = false;
      toast.success("Successfully connected!");
    } catch (error) {
      console.error("Connection failed:", error);
      NotificationManager.showError(`Connection failed: ${error.message}`);
      connectBtn.disabled = false;
    }
  });

  // Disconnect button handler
  disconnectBtn.addEventListener("click", () => {
    connectionManager.handleDisconnect();
    inputHandler.stopControl();
    stopSessionTimer();
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
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
