class NotificationManager {
  static showSuccess(message) {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "#4caf50",
      },
      onClick: function () {}, // Callback after click
    }).showToast();
  }

  static showError(message) {
    Toastify({
      text: message,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: {
        background: "#f44336",
      },
      onClick: function () {}, // Callback after click
    }).showToast();
  }

  static showWarning(message) {
    Toastify({
      text: message,
      duration: 4000,
      gravity: "top",
      position: "right",
      style: {
        background: "#ff9800",
      },
      onClick: function () {}, // Callback after click
    }).showToast();
  }

  static showInfo(message) {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "#2196f3",
      },
      onClick: function () {}, // Callback after click
    }).showToast();
  }
}
