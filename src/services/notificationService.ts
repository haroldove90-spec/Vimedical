import { toast } from 'react-hot-toast';

/**
 * Notification Service
 * Handles voice (TTS), sound, and browser notifications.
 */

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notification");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const playNotificationSound = () => {
  try {
    // Using a standard notification sound URL
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        // Silently handle autplay block - this is expected if no user interaction yet
        console.log("Autoplay of notification sound blocked until user interaction.");
      });
    }
  } catch (e) {
    console.warn("Could not play notification sound:", e);
  }
};

export const speakMessage = (message: string) => {
  if (!("speechSynthesis" in window)) {
    console.warn("This browser does not support speech synthesis");
    return;
  }

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "es-ES"; // Spanish
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Speech synthesis failed:", e);
  }
};

export const showNotification = (title: string, body: string) => {
  if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico", // Or a specific medical icon
    });
  }
};

/**
 * Trigger a full notification (Sound + Voice + Popup)
 */
export const triggerFullNotification = (title: string, body: string, voiceMessage?: string) => {
  playNotificationSound();
  showNotification(title, body);
  speakMessage(voiceMessage || body);
  
  // Custom UI Toast
  toast.success(`${title}: ${body}`, {
    duration: 6000,
    position: 'top-right',
    style: {
      background: '#1e293b',
      color: '#fff',
      borderRadius: '1rem',
      padding: '1rem',
      fontWeight: 'bold',
      border: '2px solid #3C6B94'
    }
  });
};
