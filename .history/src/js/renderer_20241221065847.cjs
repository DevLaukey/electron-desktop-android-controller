const InputHandler = require("./input/input-handler");
const QueueManager = require("./queue/queue-manager");
const { notifications } = require("./utils/notifications");
const ConnectionManager = require("./webrtc/connection-manager");
let connectionManager;
let inputHandler;
let queueManager;

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Starting application initialization...");

  try {
    console.log("📡 Setting up connection managers...");
    const serverUrl = "http://your-signaling-server:3000";
    connectionManager = new ConnectionManager(serverUrl);
    console.log("✅ ConnectionManager initialized");

    inputHandler = new InputHandler(connectionManager.socket);
    console.log("✅ InputHandler initialized");

    queueManager = new QueueManager(connectionManager.socket);
    console.log("✅ QueueManager initialized");

    notifications.success("Application initialized successfully");
    console.log("🎉 Application fully initialized");
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    notifications.error(`Failed to initialize application: ${error.message}`);
  }

  // Global error handlers
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error("🔥 Global error:", {
      message: msg,
      url,
      lineNo,
      columnNo,
      error,
    });
    notifications.error(`An unexpected error occurred: ${msg}`);
    return false;
  };

  window.onunhandledrejection = function (event) {
    console.error("🔥 Unhandled promise rejection:", event.reason);
    notifications.error(
      `An unexpected error occurred: ${event.reason.message}`
    );
  };

  // UI Elements initialization
  console.log("🎨 Setting up UI elements...");
  const connectBtn = document.getElementById("connect-btn");
  const disconnectBtn = document.getElementById("disconnect-btn");
  const remoteScreen = document.getElementById("remote-screen");

  if (!connectBtn || !disconnectBtn || !remoteScreen) {
    console.error("❌ Failed to find some UI elements:", {
      connectBtn: !!connectBtn,
      disconnectBtn: !!disconnectBtn,
      remoteScreen: !!remoteScreen,
    });
  } else {
    console.log("✅ All UI elements found");
  }

  // Connect button handler
  connectBtn.addEventListener("click", async () => {
    console.log("🔌 Connect button clicked");
    try {
      notifications.info("Attempting to connect...");
      console.log("⏳ Simulating connection delay...");

      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("✅ Delay completed, initializing connection...");

      await connectionManager.initializeConnection();
      console.log("✅ Connection initialized");

      inputHandler.startControl();
      console.log("✅ Input handler started");

      startSessionTimer();
      console.log("✅ Session timer started");

      notifications.success("Successfully connected!");
      console.log("🎉 Connection process completed successfully");

      connectBtn.disabled = true;
      disconnectBtn.disabled = false;
    } catch (error) {
      console.error("❌ Connection failed:", {
        error,
        message: error.message,
        stack: error.stack,
      });
      notifications.error("Failed to connect: " + error.message);

      connectBtn.disabled = false;
      disconnectBtn.disabled = true;
    }
  });

  // Disconnect button handler
  disconnectBtn.addEventListener("click", () => {
    console.log("🔌 Disconnect button clicked");
    try {
      notifications.info("Disconnecting...");
      console.log("⏳ Starting disconnect process...");

      connectionManager.handleDisconnect();
      console.log("✅ Connection manager disconnected");

      inputHandler.stopControl();
      console.log("✅ Input handler stopped");

      stopSessionTimer();
      console.log("✅ Session timer stopped");

      notifications.success("Successfully disconnected!");
      console.log("🎉 Disconnect process completed successfully");

      connectBtn.disabled = false;
      disconnectBtn.disabled = true;
    } catch (error) {
      console.error("❌ Disconnect failed:", {
        error,
        message: error.message,
        stack: error.stack,
      });
      notifications.error("Failed to disconnect: " + error.message);
    }
  });

  // Device disconnection handler
  document.addEventListener("deviceDisconnected", () => {
    console.log("📱 Device disconnected event received");
    inputHandler.stopControl();
    stopSessionTimer();
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
    document.getElementById("device-id").textContent = "-";
    console.log("✅ Device disconnect handled");
  });

  // Session start handler
  document.addEventListener("sessionStarted", (event) => {
    console.log("🎬 Session started event received", event.detail);
    const { deviceId, duration } = event.detail;
    document.getElementById("device-id").textContent = deviceId;
    if (duration) {
      console.log(`⏱️ Starting session timer with duration: ${duration}s`);
      startSessionTimer(duration);
    }
  });
});

// Timer functions
function startSessionTimer(duration) {
  console.log(
    `⏱️ Starting session timer${duration ? ` with duration ${duration}s` : ""}`
  );
  if (duration) {
    sessionEndTime = Date.now() + duration * 1000;
  }

  sessionTimer = setInterval(() => {
    const now = Date.now();
    if (sessionEndTime && now >= sessionEndTime) {
      console.log("⏱️ Session time expired");
      connectionManager.handleDisconnect();
      return;
    }

    const elapsedSeconds = Math.floor(
      (now - (sessionEndTime - duration * 1000)) / 1000
    );
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
    document.getElementById("session-time").textContent = timeString;
  }, 1000);
}

function stopSessionTimer() {
  console.log("⏱️ Stopping session timer");
  if (sessionTimer) {
    clearInterval(sessionTimer);
    sessionTimer = null;
  }
  document.getElementById("session-time").textContent = "00:00";
  sessionEndTime = null;
  console.log("✅ Session timer stopped");
}
