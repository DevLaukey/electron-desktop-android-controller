const io = require("socket.io-client");

class ConnectionManager {
  constructor(serverUrl) {
    this.socket = io(serverUrl);
    this.peerConnection = null;
    this.remoteStream = null;
    this._setupSocketHandlers();
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
