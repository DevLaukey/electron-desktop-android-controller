const toast = {
  success: (message) => {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "#4caf50",
      },
    }).showToast();
  },

  error: (message) => {
    Toastify({
      text: message,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: {
        background: "#f44336",
      },
    }).showToast();
  },

  info: (message) => {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "#2196f3",
      },
    }).showToast();
  },
};



export   toast