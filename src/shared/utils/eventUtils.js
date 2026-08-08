/**
 * Safe Event Dispatcher to avoid 'Illegal constructor' errors in Safari and old browsers.
 * Tries the modern CustomEvent constructor first, then falls back to document.createEvent.
 * 
 * @param {string} name - Event name
 * @param {object} detail - Custom data to pass with the event
 */
export const dispatchSafeEvent = (name, detail = null) => {
  try {
    let event;
    try {
      // First try standard constructor
      event = new CustomEvent(name, { detail: detail, bubbles: true, cancelable: true });
    } catch (e) {
      // Fallback for browsers with "Illegal constructor" issues
      if (typeof document !== 'undefined' && document.createEvent) {
        event = document.createEvent('CustomEvent');
        event.initCustomEvent(name, true, true, detail);
      }
    }
    
    if (event && typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  } catch (err) {
    console.error(`[Event Error] Failed to dispatch ${name}:`, err);
  }
};
