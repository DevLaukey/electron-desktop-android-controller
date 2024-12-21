class QueueManager {
  constructor(socket) {
    this.socket = socket;
    this.queue = [];
    this._setupSocketHandlers();
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
