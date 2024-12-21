
// renderer.js
import { ConnectionManager } from './webrtc/connection-manager.js';
import { InputHandler } from './input/input-handler.js';
import { QueueManager } from './queue/queue-manager.js';

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
    queueList: null
};

// Notification helper
const notify = {
    show: (message, type = 'info') => {
        console.log(`💬 ${type.toUpperCase()}: ${message}`);
        window.electronAPI?.showNotification({
            title: type.charAt(0).toUpperCase() + type.slice(1),
            body: message,
            type: type
        });
    }
};

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Starting application initialization...");
    initializeUI();
    initializeManagers();
    setupEventListeners();
});

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
            throw new Error(`Missing UI elements: ${missingElements.join(', ')}`);
        }

        // Initial UI state
        elements.disconnectBtn.disabled = true;
        elements.deviceId.textContent = "-";
        elements.sessionTime.textContent = "00:00";

        console.log("✅ All UI elements initialized");
    } catch (error) {
        notify.show(`Failed to initialize UI: ${error.message}`, "error");
    }
}

function initializeManagers() {
    try {
        console.log("📡 Setting up managers...");
        
        const serverUrl = "http://your-signaling-server:3000"; // Replace with your server URL
        connectionManager = new ConnectionManager(serverUrl);
        console.log("✅ ConnectionManager initialized");

        inputHandler = new InputHandler(connectionManager.socket);
        console.log("✅ InputHandler initialized");

        queueManager = new QueueManager(connectionManager.socket);
        console.log("✅ QueueManager initialized");

        notify.show("Application initialized successfully", "success");
    } catch (error) {
        notify.show(`Failed to initialize managers: ${error.message}`, "error");
    }
}

function setupEventListeners() {
    elements.connectBtn.addEventListener("click", handleConnect);
    elements.disconnectBtn.addEventListener("click", handleDisconnect);
    document.addEventListener("deviceDisconnected", handleDeviceDisconnected);
    document.addEventListener("sessionStarted", handleSessionStarted);
    setupGlobalErrorHandlers();
}

async function handleConnect() {
    console.log("🔌 Connect button clicked");
    try {
        notify.show("Attempting to connect to remote device...", "info");
        elements.connectBtn.disabled = true;
        
        await connectionManager.initializeConnection();
        inputHandler.startControl();
        startSessionTimer();

        elements.disconnectBtn.disabled = false;
        notify.show("Successfully connected to remote device!", "success");
    } catch (error) {
        notify.show(`Connection failed: ${error.message}`, "error");
        elements.connectBtn.disabled = false;
    }
}

function handleDisconnect() {
    console.log("🔌 Disconnect button clicked");
    try {
        notify.show("Disconnecting from remote device...", "info");
        
        connectionManager.handleDisconnect();
        inputHandler.stopControl();
        stopSessionTimer();
        
        elements.connectBtn.disabled = false;
        elements.disconnectBtn.disabled = true;
        elements.deviceId.textContent = "-";
        
        notify.show("Successfully disconnected from remote device", "success");
    } catch (error) {
        notify.show(`Disconnect failed: ${error.message}`, "error");
    }
}

function handleDeviceDisconnected() {
    console.log("📱 Device disconnected event received");
    try {
        notify.show("Remote device has disconnected", "info");
        
        inputHandler.stopControl();
        stopSessionTimer();
        
        elements.connectBtn.disabled = false;
        elements.disconnectBtn.disabled = true;
        elements.deviceId.textContent = "-";
    } catch (error) {
        notify.show(`Error handling device disconnect: ${error.message}`, "error");
    }
}

function handleSessionStarted(event) {
    try {
        const { deviceId, duration } = event.detail;
        elements.deviceId.textContent = deviceId;
        
        if (duration) {
            startSessionTimer(duration);
            notify.show(`Session started with device ${deviceId}`, "success");
        }
    } catch (error) {
        notify.show(`Error handling session start: ${error.message}`, "error");
    }
}

function setupGlobalErrorHandlers() {
    window.onerror = (msg, url, lineNo, columnNo, error) => {
        notify.show(`An unexpected error occurred: ${msg}`, "error");
        return false;
    };
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
