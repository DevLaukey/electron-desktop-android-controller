document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connect-btn");
  const disconnectBtn = document.getElementById("disconnect-btn");
  const remoteScreen = document.getElementById("remote-screen");
  const sessionTime = document.getElementById("session-time");
  const deviceId = document.getElementById("device-id");

  let sessionInterval;

  // Connect button click handler
  connectBtn.addEventListener("click", async () => {
    try {
      // Call the exposed API from preload script
      await window.electronAPI.connectToDevice("test-device-id");
      startSessionTimer();
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  });

  // Disconnect button click handler
  disconnectBtn.addEventListener("click", async () => {
    try {
      await window.electronAPI.disconnectFromDevice();
      stopSessionTimer();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  });

  // Session timer functions
  function startSessionTimer() {
    let seconds = 0;
    sessionInterval = setInterval(() => {
      seconds++;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      sessionTime.textContent = `${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }, 1000);
  }

  function stopSessionTimer() {
    if (sessionInterval) {
      clearInterval(sessionInterval);
      sessionTime.textContent = "00:00";
    }
  }
});
