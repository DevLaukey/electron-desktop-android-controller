const io = require("socket.io")(server);

export class ConnectionManager {
  constructor(serverUrl) {
    this.socket = io(serverUrl, {
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
      NotificationManager.showError(`Connection failed: ${error.message}`);
      console.error("Socket connection error:", error);
    });

    this.socket.on("connect_timeout", () => {
      NotificationManager.showError(
        "Connection timeout. Please check your internet connection."
      );
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      NotificationManager.showInfo(
        `Attempting to reconnect... (${attemptNumber}/5)`
      );
    });

    this.socket.on("reconnect_failed", () => {
      NotificationManager.showError(
        "Failed to reconnect. Please try again later."
      );
    });

    this.socket.on("reconnect", (attemptNumber) => {
      NotificationManager.showSuccess("Reconnected successfully!");
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
      NotificationManager.showInfo("Initializing connection...");
    } catch (error) {
      NotificationManager.showError(
        `Failed to initialize connection: ${error.message}`
      );
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
      }
    });

    this.socket.on("ice-candidate", async (candidate) => {
      try {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error("Error adding ice candidate:", error);
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
    NotificationManager.showError(`${context}: ${error.message}`);
  }
}
