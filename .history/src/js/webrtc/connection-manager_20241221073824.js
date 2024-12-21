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

export class ConnectionManager {
  constructor(serverUrl) {
    try {
      if (!serverUrl) {
        throw new Error("Server URL is required");
      }

      // Try to create URL object to validate the server URL
      const url = new URL(serverUrl);

      // Use the global io object
      this.socket = window.io(serverUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 5000, // 5 second timeout for initial connection
      });

      this.peerConnection = null;
      this.remoteStream = null;
      this._setupSocketHandlers();
      this._setupSocketErrorHandling();

      // Add immediate connection error handling
      this.socket.on("connect", () => {
        notify.success("Connected to server successfully");
      });

      // Handle initial connection failure
      setTimeout(() => {
        if (!this.socket.connected) {
          notify.error(
            `Unable to connect to server at ${serverUrl}. Please check if the server is running.`
          );
        }
      }, 5000);
    } catch (error) {
      // Handle invalid URLs or connection setup failures
      notify.error(
        `Invalid server URL or connection setup failed: ${error.message}`
      );
      throw error;
    }
  }

  _setupSocketErrorHandling() {
    this.socket.on("connect_error", (error) => {
      notify.error(
        `Server connection failed: ${error.message}. Please check if the server is running.`
      );
      console.error("Socket connection error:", error);
    });

    this.socket.on("connect_timeout", () => {
      notify.error(
        "Server connection timed out. Please check your internet connection and server status."
      );
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      notify.info(`Attempting to reconnect to server... (${attemptNumber}/5)`);
    });

    this.socket.on("reconnect_failed", () => {
      notify.error(
        "Failed to reconnect to server. Please check if the server is running."
      );
    });

    this.socket.on("reconnect", (attemptNumber) => {
      notify.success("Reconnected to server successfully!");
    });

    // Handle server disconnect
    this.socket.on("disconnect", (reason) => {
      notify.error(`Disconnected from server: ${reason}`);
      if (reason === "io server disconnect") {
        // Server initiated the disconnect
        notify.info(
          "The server has disconnected. You may need to reconnect manually."
        );
      } else {
        // Connection lost
        notify.info("Connection to server lost. Attempting to reconnect...");
      }
    });
  }

  async initializeConnection() {
    try {
      if (!this.socket.connected) {
        throw new Error(
          "Not connected to server. Please check your connection and try again."
        );
      }

      if (this.peerConnection) {
        await this.handleDisconnect();
      }

      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      this._setupPeerConnectionHandlers();
      notify.info("Initializing connection...");
    } catch (error) {
      notify.error(`Failed to initialize connection: ${error.message}`);
      throw error;
    }
  }

  // Rest of the class implementation remains the same
  _setupSocketHandlers() {
    this.socket.on("offer", async (offer) => {
      try {
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.socket.emit("answer", answer);
      } catch (error) {
        console.error("Error handling offer:", error);
        this.handleError(error, "Error handling offer");
      }
    });

    this.socket.on("ice-candidate", async (candidate) => {
      try {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error("Error adding ice candidate:", error);
        this.handleError(error, "Error adding ICE candidate");
      }
    });

    this.socket.on("device-disconnected", () => {
      this.handleDisconnect();
    });
  }

  _setupPeerConnectionHandlers() {
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      const videoElement = document.getElementById("remote-screen");
      if (videoElement) {
        videoElement.srcObject = this.remoteStream;
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit("ice-candidate", event.candidate);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection.connectionState === "disconnected") {
        this.handleDisconnect();
      }
    };
  }

  handleDisconnect() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }
    document.dispatchEvent(new Event("deviceDisconnected"));
  }

  handleError(error, context) {
    console.error(`${context}:`, error);
    notify.error(`${context}: ${error.message}`);
  }
}
