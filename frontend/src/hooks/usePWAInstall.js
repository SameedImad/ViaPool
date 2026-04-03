import { useEffect, useState } from "react";

let deferredPrompt = null;
const listeners = new Set();

const notifyListeners = () => {
  const available = Boolean(deferredPrompt);
  listeners.forEach((listener) => listener(available));
};

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  notifyListeners();
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  notifyListeners();
});

export const usePWAInstall = () => {
  const [installAvailable, setInstallAvailable] = useState(Boolean(deferredPrompt));

  useEffect(() => {
    listeners.add(setInstallAvailable);
    return () => listeners.delete(setInstallAvailable);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      window.alert("Install not available");
      return false;
    }

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    notifyListeners();
    return true;
  };

  return { installApp, installAvailable };
};
