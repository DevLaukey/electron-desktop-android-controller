// Unified notification handler that logs to console and shows to user
const notify = {
  success: (message) => {
    console.log("✅", message);
    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification({
        title: "Success",
        body: message,
        type: "success",
      });
    }
  },
  error: (message, error = null) => {
    // Log detailed error to console
    console.error("❌", message);
    if (error) {
      console.error("Detailed error:", {
        message: error.message,
        stack: error.stack,
        error,
      });
    }
    // Show user-friendly message
    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification({
        title: "Error",
        body: message,
        type: "error",
      });
    }
  },
  info: (message) => {
    console.info("ℹ️", message);
    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification({
        title: "Info",
        body: message,
        type: "info",
      });
    }
  },
};

// ES module imports
import { InputHandler } from "./input/input-handler.js";
import { QueueManager } from "./queue/queue-manager.js";
import { ConnectionManager } from "./webrtc/connection-manager.js";

// Global variables
let connectionManager;
let inputHandler;
let queueManager;
let sessionTimer;
let sessionEndTime;

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Starting application initialization...");

  try {
    console.log("📡 Setting up connection managers...");
    const serverUrl = "http://your-signaling-server:3000";

    // Initialize connection manager with error handling
    try {
      connectionManager = new ConnectionManager(serverUrl);
      console.log("✅ ConnectionManager initialized");
    } catch (error) {
      notify.error("Failed to initialize connection manager", error);
      throw error; // Re-throw to prevent further initialization
    }

    // Initialize input handler with error handling
    try {
      inputHandler = new InputHandler(connectionManager.socket);
      console.log("✅ InputHandler initialized");
    } catch (error) {
      notify.error("Failed to initialize input handler", error);
      throw error;
    }

    // Initialize queue manager with error handling
    try {
      queueManager = new QueueManager(connectionManager.socket);
      console.log("✅ QueueManager initialized");
    } catch (error) {
      notify.error("Failed to initialize queue manager", error);
      throw error;
    }

    notify.success("Application initialized successfully");
    console.log("🎉 Application fully initialized");
  } catch (error) {
    notify.error("Application initialization failed", error);
  }

  // Global error handlers
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    notify.error(`An unexpected error occurred: ${msg}`, error);
    return false;
  };

  window.onunhandledrejection = function (event) {
    notify.error(
      `Unhandled promise rejection: ${event.reason.message}`,
      event.reason
    );
  };

  // UI Elements initialization with error handling
  console.log("🎨 Setting up UI elements...");
  const elements = {
    connectBtn: document.getElementById("connect-btn"),
    disconnectBtn: document.getElementById("disconnect-btn"),
    remoteScreen: document.getElementById("remote-screen"),
    deviceId: document.getElementById("device-id"),
    sessionTime: document.getElementById("session-time"),
  };

  // Validate all UI elements exist
  const missingElements = Object.entries(elements)
    .filter(([, element]) => !element)
    .map(([name]) => name);

  if (missingElements.length > 0) {
    notify.error(`Failed to find UI elements: ${missingElements.join(", ")}`);
    return;
  }

  console.log("✅ All UI elements found");

  // Connect button handler
  elements.connectBtn.addEventListener("click", async () => {
    console.log("🔌 Connect button clicked");
    try {
      notify.info("Attempting to connect...");

      await connectionManager.initializeConnection();
      console.log("✅ Connection initialized");

      inputHandler.startControl();
      console.log("✅ Input handler started");

      startSessionTimer();
      console.log("✅ Session timer started");

      notify.success("Successfully connected!");

      elements.connectBtn.disabled = true;
      elements.disconnectBtn.disabled = false;
    } catch (error) {
      notify.error("Connection failed", error);
      elements.connectBtn.disabled = false;
      elements.disconnectBtn.disabled = true;
    }
  });

  // Disconnect button handler
  elements.disconnectBtn.addEventListener("click", () => {
    console.log("🔌 Disconnect button clicked");
    try {
      notify.info("Disconnecting...");

      connectionManager.handleDisconnect();
      console.log("✅ Connection manager disconnected");

      inputHandler.stopControl();
      console.log("✅ Input handler stopped");

      stopSessionTimer();
      console.log("✅ Session timer stopped");

      notify.success("Successfully disconnected!");

      elements.connectBtn.disabled = false;
      elements.disconnectBtn.disabled = true;
    } catch (error) {
      notify.error("Disconnect failed", error);
    }
  });

  // Device disconnection handler
  document.addEventListener("deviceDisconnected", () => {
    console.log("📱 Device disconnected event received");
    try {
      inputHandler.stopControl();
      stopSessionTimer();
      elements.connectBtn.disabled = false;
      elements.disconnectBtn.disabled = true;
      elements.deviceId.textContent = "-";
      console.log("✅ Device disconnect handled");
    } catch (error) {
      notify.error("Error handling device disconnect", error);
    }
  });

  // Session start handler
  document.addEventListener("sessionStarted", (event) => {
    console.log("🎬 Session started event received", event.detail);
    try {
      const { deviceId, duration } = event.detail;
      elements.deviceId.textContent = deviceId;
      if (duration) {
        console.log(`⏱️ Starting session timer with duration: ${duration}s`);
        startSessionTimer(duration);
      }
    } catch (error) {
      notify.error("Error handling session start", error);
    }
  });
});

// Timer functions with error handling
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
        const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`;
        document.getElementById("session-time").textContent = timeString;
      } catch (error) {
        notify.error("Error updating session timer", error);
        stopSessionTimer(); // Stop timer if there's an error
      }
    }, 1000);
  } catch (error) {
    notify.error("Error starting session timer", error);
  }
}

function stopSessionTimer() {
  try {
    console.log("⏱️ Stopping session timer");
    if (sessionTimer) {
      clearInterval(sessionTimer);
      sessionTimer = null;
    }
    document.getElementById("session-time").textContent = "00:00";
    sessionEndTime = null;
    console.log("✅ Session timer stopped");
  } catch (error) {
    notify.error("Error stopping session timer", error);
  }
}
