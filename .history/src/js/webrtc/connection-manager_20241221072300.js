// We'll get socket.io from the electronAPI instead of importing directly
const { showNotification, createSocket } = window.electronAPI;

export class ConnectionManager {
  constructor(serverUrl) {
    // Use the exposed createSocket function from electronAPI
    this.socket = createSocket(serverUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.peerConnection = null;
    this.remoteStream = null;
    this._setupSocketHandlers();
    this._setupSocketErrorHandling();
  }

  _setupSocketErrorHandling() {
    this.socket.on("connect_error", (error) => {
      showNotification({
        title: "Connection Error",
        body: `Connection failed: ${error.message}`,
        type: "error",
      });
      console.error("Socket connection error:", error);
    });

    this.socket.on("connect_timeout", () => {
      showNotification({
        title: "Connection Timeout",
        body: "Connection timeout. Please check your internet connection.",
        type: "error",
      });
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      showNotification({
        title: "Reconnecting",
        body: `Attempting to reconnect... (${attemptNumber}/5)`,
        type: "info",
      });
    });

    this.socket.on("reconnect_failed", () => {
      showNotification({
        title: "Reconnection Failed",
        body: "Failed to reconnect. Please try again later.",
        type: "error",
      });
    });

    this.socket.on("reconnect", (attemptNumber) => {
      showNotification({
        title: "Reconnected",
        body: "Reconnected successfully!",
        type: "success",
      });
    });
  }

  async initializeConnection() {
    try {
      if (this.peerConnection) {
        await this.handleDisconnect();
      }

      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      this._setupPeerConnectionHandlers();

      showNotification({
        title: "Connecting",
        body: "Initializing connection...",
        type: "info",
      });
    } catch (error) {
      showNotification({
        title: "Connection Error",
        body: `Failed to initialize connection: ${error.message}`,
        type: "error",
      });
      throw error;
    }
  }

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
    // Trigger UI updates
    document.dispatchEvent(new Event("deviceDisconnected"));
  }

  handleError(error, context) {
    console.error(`${context}:`, error);
    showNotification({
      title: "Error",
      body: `${context}: ${error.message}`,
      type: "error",
    });
  }
}
