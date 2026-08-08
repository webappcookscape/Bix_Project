/**
 * Centralized utility for consistent date and time formatting across the application.
 * Standardizes to DD/MM/YYYY and 12-hour format as requested by the user.
 */

/**
 * Formats a date to DD/MM/YYYY
 * @param {Date|String|Number} date - Date object, ISO string, or timestamp
 * @returns {String} - Formatted date string (e.g., 03/12/2026)
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date; // Return original if invalid
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Formats a date to 12-hour time format
 * @param {Date|String|Number} date - Date object, ISO string, or timestamp
 * @returns {String} - Formatted time string (e.g., 02:30 PM)
 */
export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Formats a date to DD/MM/YYYY, HH:MM AM/PM
 * @param {Date|String|Number} date 
 * @returns {String}
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(date);
  
  if (!formattedDate) return '';
  return `${formattedDate}, ${formattedTime}`;
};

/**
 * Helper to get YYYY-MM-DD for <input type="date">
 * @param {Date|String|Number} date 
 */
export const toInputDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};
