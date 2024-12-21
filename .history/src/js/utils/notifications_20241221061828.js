const notifications = {
  success: (message) => {
    console.log("🎉 Success:", message); // Debug log
    window.electronAPI.showNotification({
      title: "Success",
      body: message,
      type: "success",
    });
  },

  error: (message) => {
    console.log("❌ Error:", message); // Debug log
    window.electronAPI.showNotification({
      title: "Error",
      body: message,
      type: "error",
    });
  },

  info: (message) => {
    console.log("ℹ️ Info:", message); // Debug log
    window.electronAPI.showNotification({
      title: "Info",
      body: message,
      type: "info",
    });
  },
};

export { notifications };
