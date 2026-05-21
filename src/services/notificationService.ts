import { toast } from 'react-hot-toast';

/**
 * Notification Service
 * Handles advanced voice (TTS), sound, and browser desktop notifications.
 * Automatically circumvents browser autoplay blocking via lazy-loaded queues 
 * and silent voice-to-audio engine pre-warming on first user gesture.
 */

let isUnlocked = false;
const pendingSpeechQueue: string[] = [];
let preferredVoice: SpeechSynthesisVoice | null = null;

// Preload/cache the best native Spanish voice if available
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const loadVoices = () => {
    const list = window.speechSynthesis.getVoices();
    // Prioritize clean, natural Spanish (Mexico, Spain or general)
    const match = list.find(v => 
      v.lang.toLowerCase() === "es-es" || 
      v.lang.toLowerCase() === "es-mx" || 
      v.lang.toLowerCase().startsWith("es-")
    );
    if (match) {
      preferredVoice = match;
    }
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

/**
 * Fully unlocks speechSynthesis and WebAudio engines with silent activation.
 * Triggered on the very first user gesture (click, tap, scroll, keydown).
 */
const unlockAudioAndSpeech = () => {
  if (isUnlocked) return;
  
  try {
    // 1. Play silent utterance to gain browser TTS clearance
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const silentUtterance = new SpeechSynthesisUtterance("");
      silentUtterance.lang = "es-ES";
      silentUtterance.volume = 0; // Completely silent
      window.speechSynthesis.speak(silentUtterance);
    }
    
    // 2. Play silent micro-audio to clear media autoplay guard rails
    const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
    silentAudio.volume = 0;
    const playPromise = silentAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }

    isUnlocked = true;
    console.log("[NotificationService] Audio and Voice engines successfully unlocked of browser sandbox.");
    
    // Remove listeners
    document.removeEventListener("click", unlockAudioAndSpeech);
    document.removeEventListener("keydown", unlockAudioAndSpeech);
    document.removeEventListener("touchstart", unlockAudioAndSpeech);
    document.removeEventListener("scroll", unlockAudioAndSpeech);

    // Speak any pending notifications that occurred while inactive/locked
    while (pendingSpeechQueue.length > 0) {
      const msg = pendingSpeechQueue.shift();
      if (msg) {
        speakMessageDirectly(msg);
      }
    }
  } catch (e) {
    console.warn("[NotificationService] Failed to pre-warm audio engines:", e);
  }
};

// Register automatic unlock triggers
if (typeof document !== "undefined") {
  document.addEventListener("click", unlockAudioAndSpeech);
  document.addEventListener("keydown", unlockAudioAndSpeech);
  document.addEventListener("touchstart", unlockAudioAndSpeech);
  document.addEventListener("scroll", unlockAudioAndSpeech);
}

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
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        console.log("[NotificationService] Audio sound deferred until user activates the frame.", e);
      });
    }
  } catch (e) {
    console.warn("Could not play notification sound:", e);
  }
};

/**
 * High-reliability speak invocation
 */
const speakMessageDirectly = (message: string) => {
  if (!("speechSynthesis" in window)) return;
  
  try {
    // Cancel lingering/hanging speeches to maintain real-time fidelity
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "es-ES";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("[NotificationService] TTS speak failed:", e);
  }
};

export const speakMessage = (message: string) => {
  if (!("speechSynthesis" in window)) {
    console.warn("This browser does not support speech synthesis");
    return;
  }

  if (isUnlocked) {
    speakMessageDirectly(message);
  } else {
    // Store in engagement queue to run instantly when page gains focus/interaction
    console.log("[NotificationService] Autoplay is locked. Queuing voice alert:", message);
    pendingSpeechQueue.push(message);
  }
};

export const showNotification = (title: string, body: string) => {
  if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
    });
  }
};

/**
 * Trigger a full notification (Sound + Voice + Popup Toast)
 */
export const triggerFullNotification = (title: string, body: string, voiceMessage?: string) => {
  playNotificationSound();
  showNotification(title, body);
  speakMessage(voiceMessage || body);
  
  // Custom Elegant UI Toast
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

