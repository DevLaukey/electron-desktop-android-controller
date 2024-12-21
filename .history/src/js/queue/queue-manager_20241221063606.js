class QueueManager {
  constructor(socket) {
    console.log("📋 Initializing QueueManager");

    this.socket = socket;
    this.queue = [];
    this._setupSocketHandlers();
    this._setupErrorHandling();
  }

  _setupErrorHandling() {
    this.socket.on("queue-error", (error) => {
      NotificationManager.showError(`Queue error: ${error.message}`);
    });

    this.socket.on("session-error", (error) => {
      NotificationManager.showError(`Session error: ${error.message}`);
    });
  }

  _handleQueueError(error, context) {
    console.error(`Queue error (${context}):`, error);
    NotificationManager.showError(`Queue error: ${error.message}`);
  }

  _setupSocketHandlers() {
    this.socket.on("queue-update", (queueData) => {
      this.queue = queueData;
      this._updateQueueUI();
    });

    this.socket.on("session-assigned", (sessionData) => {
      this._handleSessionAssigned(sessionData);
    });
  }

  _updateQueueUI() {
    const queueList = document.getElementById("queue-list");
    queueList.innerHTML = "";

    this.queue.forEach((entry) => {
      const entryElement = document.createElement("div");
      entryElement.className = "queue-entry";
      entryElement.innerHTML = `
                <div class="device-info">
                    <span class="device-id">${entry.deviceId}</span>
                    <span class="wait-time">${this._formatWaitTime(
                      entry.requestTime
                    )}</span>
                </div>
            `;
      queueList.appendChild(entryElement);
    });
  }

  _formatWaitTime(requestTime) {
    const waitTime = Math.floor((Date.now() - new Date(requestTime)) / 1000);
    const minutes = Math.floor(waitTime / 60);
    const seconds = waitTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  _handleSessionAssigned(sessionData) {
    document.getElementById("device-id").textContent = sessionData.deviceId;
    // Trigger session start in the UI
    document.dispatchEvent(
      new CustomEvent("sessionStarted", {
        detail: sessionData,
      })
    );
  }
}
module.exports = QueueManager;