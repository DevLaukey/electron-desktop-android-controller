// Import managers and handlers
import { ConnectionManager } from "./webrtc/connection-manager.js";
import { InputHandler } from "./input/input-handler.js";
import { QueueManager } from "./queue/queue-manager.js";

// Global state
let connectionManager;
let inputHandler;
let queueManager;
let sessionTimer;
let sessionEndTime;

// UI Elements cache
const elements = {
  connectBtn: null,
  disconnectBtn: null,
  remoteScreen: null,
  deviceId: null,
  sessionTime: null,
  queueList: null,
};

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Starting application initialization...");
  initializeUI();
  initializeManagers();
  setupEventListeners();
});

// Initialize UI elements
function initializeUI() {
  try {
    console.log("🎨 Setting up UI elements...");

    elements.connectBtn = document.getElementById("connect-btn");
    elements.disconnectBtn = document.getElementById("disconnect-btn");
    elements.remoteScreen = document.getElementById("remote-screen");
    elements.deviceId = document.getElementById("device-id");
    elements.sessionTime = document.getElementById("session-time");
    elements.queueList = document.getElementById("queue-list");

    // Validate all UI elements
    const missingElements = Object.entries(elements)
      .filter(([, element]) => !element)
      .map(([name]) => name);

    if (missingElements.length > 0) {
      throw new Error(`Missing UI elements: ${missingElements.join(", ")}`);
    }

    // Initial UI state
    elements.disconnectBtn.disabled = true;
    elements.deviceId.textContent = "-";
    elements.sessionTime.textContent = "00:00";

    console.log("✅ All UI elements initialized");
  } catch (error) {
    console.error("❌ UI initialization failed:", error);
    window.electronAPI?.showNotification({
      title: "Error",
      body: `Failed to initialize UI: ${error.message}`,
      type: "error",
    });
  }
}

// Initialize managers
function initializeManagers() {
  try {
    console.log("📡 Setting up connection managers...");

    // Initialize connection manager
    const serverUrl = "http://your-signaling-server:3000"; // Replace with your server URL
    connectionManager = new ConnectionManager(serverUrl);
    console.log("✅ ConnectionManager initialized");

    // Initialize input handler
    inputHandler = new InputHandler(connectionManager.socket);
    console.log("✅ InputHandler initialized");

    // Initialize queue manager
    queueManager = new QueueManager(connectionManager.socket);
    console.log("✅ QueueManager initialized");

    console.log("🎉 All managers initialized successfully");
  } catch (error) {
    console.error("❌ Manager initialization failed:", error);
    window.electronAPI?.showNotification({
      title: "Error",
      body: `Failed to initialize managers: ${error.message}`,
      type: "error",
    });
  }
}

// Setup event listeners
function setupEventListeners() {
  // Connect button handler
  elements.connectBtn.addEventListener("click", handleConnect);

  // Disconnect button handler
  elements.disconnectBtn.addEventListener("click", handleDisconnect);

  // Device disconnection handler
  document.addEventListener("deviceDisconnected", handleDeviceDisconnected);

  // Session start handler
  document.addEventListener("sessionStarted", handleSessionStarted);

  // Global error handlers
  setupGlobalErrorHandlers();
}

// Handle connect button click
async function handleConnect() {
  console.log("🔌 Connect button clicked");
  try {
    elements.connectBtn.disabled = true;

    console.log("⏳ Initializing connection...");
    await connectionManager.initializeConnection();

    inputHandler.startControl();
    console.log("✅ Input handler started");

    startSessionTimer();
    console.log("✅ Session timer started");

    elements.disconnectBtn.disabled = false;
    console.log("🎉 Connection process completed successfully");
  } catch (error) {
    console.error("❌ Connection failed:", error);
    window.electronAPI?.showNotification({
      title: "Error",
      body: `Connection failed: ${error.message}`,
      type: "error",
    });
    elements.connectBtn.disabled = false;
  }
}

// Handle disconnect button click
function handleDisconnect() {
  console.log("🔌 Disconnect button clicked");
  try {
    connectionManager.handleDisconnect();
    inputHandler.stopControl();
    stopSessionTimer();

    elements.connectBtn.disabled = false;
    elements.disconnectBtn.disabled = true;
    elements.deviceId.textContent = "-";

    console.log("✅ Disconnect completed successfully");
  } catch (error) {
    console.error("❌ Disconnect failed:", error);
    window.electronAPI?.showNotification({
      title: "Error",
      body: `Disconnect failed: ${error.message}`,
      type: "error",
    });
  }
}

// Handle device disconnected event
function handleDeviceDisconnected() {
  console.log("📱 Device disconnected event received");
  try {
    inputHandler.stopControl();
    stopSessionTimer();

    elements.connectBtn.disabled = false;
    elements.disconnectBtn.disabled = true;
    elements.deviceId.textContent = "-";

    console.log("✅ Device disconnect handled");
  } catch (error) {
    console.error("❌ Device disconnect handling failed:", error);
  }
}

// Handle session started event
function handleSessionStarted(event) {
  console.log("🎬 Session started event received", event.detail);
  try {
    const { deviceId, duration } = event.detail;
    elements.deviceId.textContent = deviceId;

    if (duration) {
      console.log(`⏱️ Starting session timer with duration: ${duration}s`);
      startSessionTimer(duration);
    }
  } catch (error) {
    console.error("❌ Session start handling failed:", error);
  }
}

// Setup global error handlers
function setupGlobalErrorHandlers() {
  window.onerror = (msg, url, lineNo, columnNo, error) => {
    console.error("🔥 Global error:", {
      message: msg,
      url,
      lineNo,
      columnNo,
      error,
    });
    window.electronAPI?.showNotification({
      title: "Error",
      body: `An unexpected error occurred: ${msg}`,
      type: "error",
    });
    return false;
  };

  window.onunhandledrejection = (event) => {
    console.error("🔥 Unhandled promise rejection:", event.reason);
    window.electronAPI?.showNotification({
      title: "Error",
      body: `An unexpected error occurred: ${event.reason.message}`,
      type: "error",
    });
  };
}

// Timer functions
function startSessionTimer(duration) {
  try {
    console.log(
      `⏱️ Starting session timer${
        duration ? ` with duration ${duration}s` : ""
      }`
    );

    if (duration) {
      sessionEndTime = Date.now() + duration * 1000;
    }

    sessionTimer = setInterval(() => {
      try {
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

        elements.sessionTime.textContent = `${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      } catch (error) {
        console.error("❌ Error updating timer:", error);
        stopSessionTimer();
      }
    }, 1000);
  } catch (error) {
    console.error("❌ Error starting timer:", error);
  }
}

function stopSessionTimer() {
  try {
    console.log("⏱️ Stopping session timer");

    if (sessionTimer) {
      clearInterval(sessionTimer);
      sessionTimer = null;
    }

    elements.sessionTime.textContent = "00:00";
    sessionEndTime = null;

    console.log("✅ Session timer stopped");
  } catch (error) {
    console.error("❌ Error stopping timer:", error);
  }
}

// Clean up function to be called when closing the application
function cleanup() {
  try {
    stopSessionTimer();
    if (connectionManager) {
      connectionManager.destroy();
    }
    if (inputHandler) {
      inputHandler.stopControl();
    }
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  }
}

// Export cleanup function if needed
export { cleanup };
