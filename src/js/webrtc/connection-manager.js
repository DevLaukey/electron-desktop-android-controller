// connection-manager.js
const notify = {
  success: (message) => {
    console.log("✅", message);
    if (window.electronAPI) {
      window.electronAPI.showNotification({
        title: "Success",
        body: message,
        type: "success",
      });
    }
  },
  error: (message, error = null) => {
    console.error("❌", message);
    if (error) {
      console.error("Technical details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      });
    }
    if (window.electronAPI) {
      window.electronAPI.showNotification({
        title: "Error",
        body: message,
        type: "error",
      });
    }
  },
  info: (message) => {
    console.info("ℹ️", message);
    if (window.electronAPI) {
      window.electronAPI.showNotification({
        title: "Info",
        body: message,
        type: "info",
      });
    }
  },
};

export class ConnectionManager {
  constructor(serverUrl) {
    this.peerConnection = null;
    this.remoteStream = null;
    this.socket = null;
    this.connectionTimeout = null;
    this.isConnecting = false;

    try {
      this.validateServerUrl(serverUrl);
      this.initializeSocket(serverUrl);
    } catch (error) {
      notify.error("Failed to create connection manager", error);
      throw error;
    }
  }

  validateServerUrl(serverUrl) {
    if (!serverUrl) {
      throw new Error("Server URL is required");
    }
    try {
      new URL(serverUrl);
    } catch (error) {
      throw new Error(`Invalid server URL: ${error.message}`);
    }
  }

  initializeSocket(serverUrl) {
    try {
      this.socket = window.io(serverUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 5000,
        autoConnect: true,
      });

      this._setupSocketHandlers();
      this._setupSocketErrorHandling();

      this.connectionTimeout = setTimeout(() => {
        if (!this.socket.connected && !this.isConnecting) {
          notify.error(
            `Connection timeout: Unable to reach server at ${serverUrl}`
          );
        }
      }, 5000);
    } catch (error) {
      notify.error("Failed to initialize socket connection", error);
      throw error;
    }
  }

  _setupSocketErrorHandling() {
    if (!this.socket) return;

    this.socket.on("connect_error", (error) => {
      notify.error("Server connection failed", error);
    });

    this.socket.on("connect_timeout", () => {
      notify.error(
        "Connection timed out. Please check your network connection."
      );
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      this.isConnecting = true;
      notify.info(`Reconnection attempt ${attemptNumber}/5`);
    });

    this.socket.on("reconnect_failed", () => {
      this.isConnecting = false;
      notify.error(
        "Failed to reconnect after multiple attempts. Please try again later."
      );
    });

    this.socket.on("reconnect", (attemptNumber) => {
      this.isConnecting = false;
      notify.success("Successfully reconnected to server");
    });

    this.socket.on("disconnect", (reason) => {
      this.handleDisconnectReason(reason);
    });

    this.socket.on("connect", () => {
      this.isConnecting = false;
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      notify.success("Connected to server successfully");
    });
  }

  handleDisconnectReason(reason) {
    const disconnectMessages = {
      "io server disconnect":
        "Server has disconnected. Please reconnect manually.",
      "io client disconnect": "Disconnected from server.",
      "ping timeout": "Connection timed out due to network issues.",
      "transport close": "Network connection lost.",
      "transport error": "Network error occurred.",
    };

    const message = disconnectMessages[reason] || `Disconnected: ${reason}`;
    notify.error(message);
  }

  async initializeConnection() {
    try {
      if (!this.socket?.connected) {
        throw new Error(
          "Not connected to server. Please ensure connection before initializing."
        );
      }

      if (this.peerConnection) {
        await this.handleDisconnect();
      }

      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      this._setupPeerConnectionHandlers();
      notify.info("Initializing peer connection...");
    } catch (error) {
      notify.error("Failed to initialize peer connection", error);
      throw error;
    }
  }

  _setupSocketHandlers() {
    if (!this.socket) return;

    this.socket.on("offer", async (offer) => {
      try {
        if (!this.peerConnection) {
          throw new Error("Peer connection not initialized");
        }

        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.socket.emit("answer", answer);
      } catch (error) {
        this.handleError(error, "Failed to process offer");
      }
    });

    this.socket.on("ice-candidate", async (candidate) => {
      try {
        if (!this.peerConnection) {
          throw new Error("Peer connection not initialized");
        }

        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        this.handleError(error, "Failed to add ICE candidate");
      }
    });

    this.socket.on("device-disconnected", () => {
      notify.info("Remote device disconnected");
      this.handleDisconnect();
    });
  }

  _setupPeerConnectionHandlers() {
    if (!this.peerConnection) return;

    this.peerConnection.ontrack = (event) => {
      try {
        this.remoteStream = event.streams[0];
        const videoElement = document.getElementById("remote-screen");
        if (videoElement) {
          videoElement.srcObject = this.remoteStream;
        } else {
          throw new Error("Remote screen video element not found");
        }
      } catch (error) {
        this.handleError(error, "Failed to handle incoming track");
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket?.emit("ice-candidate", event.candidate);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      notify.info(`WebRTC connection state: ${state}`);

      if (
        state === "disconnected" ||
        state === "failed" ||
        state === "closed"
      ) {
        this.handleDisconnect();
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection.iceConnectionState;
      notify.info(`ICE connection state: ${state}`);
    };
  }

  handleDisconnect() {
    try {
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      if (this.remoteStream) {
        this.remoteStream.getTracks().forEach((track) => track.stop());
        this.remoteStream = null;
      }

      const videoElement = document.getElementById("remote-screen");
      if (videoElement) {
        videoElement.srcObject = null;
      }

      document.dispatchEvent(new Event("deviceDisconnected"));
      notify.info("Disconnected from remote device");
    } catch (error) {
      notify.error("Error during disconnect", error);
    }
  }

  handleError(error, context) {
    notify.error(context, error);
  }

  destroy() {
    try {
      this.handleDisconnect();
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
      }
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
    } catch (error) {
      notify.error("Error during cleanup", error);
    }
  }
}
