 export const notifications = {
  success: (message) => {
    window.electronAPI.showNotification({
      title: "Success",
      body: message,
      type: "success",
    });
  },

  error: (message) => {
    window.electronAPI.showNotification({
      title: "Error",
      body: message,
      type: "error",
    });
  },

  info: (message) => {
    window.electronAPI.showNotification({
      title: "Info",
      body: message,
      type: "info",
    });
  },
};
